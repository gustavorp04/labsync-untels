from django.db import transaction, models
from django.db.models import Q
from django.utils import timezone
from datetime import timedelta
from ..models import (
    Reserva, HorarioDisponible, ActivoLaboratorio, ReservaDetalle,
    HistorialMantenimiento, Usuario, TipoLaboratorio, HistorialReserva, Asistencia
)

def crear_reserva_docente(usuario, horario, cantidad_alumnos, acepta_dj, activos_ids=None):
    """PBI-03: Docente reserva laboratorio. Abre el lab para co-existencia."""
    with transaction.atomic():
        try:
            horario_db = HorarioDisponible.objects.select_for_update().get(pk=horario.id_horario)
        except HorarioDisponible.DoesNotExist:
            return None, "El horario ya no está disponible."

        if horario_db.estado != 'Disponible':
            return None, "Este horario ya fue reservado o ha alcanzado su capacidad máxima."

        # PBI-03: Anticipación de 24 horas para docentes también
        manana = timezone.now().date() + timedelta(days=1)
        if horario_db.fecha < manana:
            return None, "Las reservas deben hacerse con al menos 24 horas de anticipación."

        # PBI-06: Si hay alumnos en 'Pendiente', el docente tiene prioridad absoluta.
        # Se cancelan las reservas de alumnos para dar paso al docente.
        estudiantes_pendientes = Reserva.objects.filter(id_horario=horario_db, estado='Pendiente')
        if estudiantes_pendientes.exists():
            for r in estudiantes_pendientes:
                r.estado = 'Cancelada'
                r.save()
                try:
                    HistorialReserva.objects.create(
                        reserva=r,
                        estado_anterior='Pendiente',
                        estado_nuevo='Cancelada',
                        observacion="Cancelación automática: Prioridad Docente."
                    )
                except:
                    pass

        nueva_reserva = Reserva.objects.create(
            id_usuario=usuario,
            id_horario=horario_db,
            cantidad_alumnos=cantidad_alumnos,
            acepto_declaracion_jurada=acepta_dj,
            estado='Programada',
            created_at=timezone.now(),
            updated_at=timezone.now()
        )

        if activos_ids:
            activos = ActivoLaboratorio.objects.filter(id_activo__in=activos_ids)
            for activo in activos:
                ReservaDetalle.objects.create(id_reserva=nueva_reserva, id_activo=activo)

        # MODO CO-EXISTENCIA: Solo ocupamos las máquinas seleccionadas
        num_maquinas = len(activos_ids) if activos_ids else horario_db.capacidad_total
        horario_db.capacidad_ocupada = num_maquinas
        
        # Sigue disponible para alumnos si sobran máquinas
        if horario_db.capacidad_ocupada >= horario_db.capacidad_total:
            horario_db.estado = 'Completo'
        else:
            horario_db.estado = 'Disponible'
        
        horario_db.save()
        return nueva_reserva, None

def crear_reserva_estudiante(usuario, id_horario, id_activo, acepta_dj):
    """PBI-04: Estudiante reserva máquina específica. 
    Regla: Se activa si hay 10 alumnos O si ya hay un docente (co-existencia)."""
    with transaction.atomic():
        try:
            horario_db = HorarioDisponible.objects.select_for_update().get(pk=id_horario)
            activo = ActivoLaboratorio.objects.select_for_update().get(pk=id_activo)
        except (HorarioDisponible.DoesNotExist, ActivoLaboratorio.DoesNotExist):
            return None, "Horario o equipo no encontrado."

        if not horario_db.id_laboratorio.habilitado:
            return None, "El laboratorio está inhabilitado (PBI-02)."

        if activo.estado != 'Operativo':
            return None, "El equipo seleccionado no está operativo."

        manana = timezone.now().date() + timedelta(days=1)
        if horario_db.fecha < manana:
            return None, "La reserva debe hacerse con al menos 1 día de anticipación."

        if ReservaDetalle.objects.filter(id_activo=activo, id_reserva__id_horario=horario_db, id_reserva__estado__in=['Programada', 'Pendiente']).exists():
            return None, "El equipo ya está reservado para este horario."

        # PBI-04: Lógica de activación
        docente_presente = Reserva.objects.filter(id_horario=horario_db, id_usuario__id_rol__nombre='docente', estado='Programada').exists()
        total_interesados = Reserva.objects.filter(id_horario=horario_db, estado__in=['Programada', 'Pendiente']).aggregate(total=models.Sum('cantidad_alumnos'))['total'] or 0
        nuevo_total = total_interesados + 1
        
        # Se activa si hay docente O si llegamos a 10 alumnos
        estado_inicial = 'Pendiente'
        if docente_presente or nuevo_total >= 10:
            estado_inicial = 'Programada'
            Reserva.objects.filter(id_horario=horario_db, estado='Pendiente').update(estado='Programada')

        nueva_reserva = Reserva.objects.create(
            id_usuario=usuario,
            id_horario=horario_db,
            cantidad_alumnos=1,
            acepto_declaracion_jurada=acepta_dj,
            estado=estado_inicial,
            created_at=timezone.now(),
            updated_at=timezone.now()
        )

        ReservaDetalle.objects.create(id_reserva=nueva_reserva, id_activo=activo)
        horario_db.capacidad_ocupada = nuevo_total
        if horario_db.capacidad_ocupada >= horario_db.capacidad_total:
            horario_db.estado = 'Completo'
        horario_db.save()

        return nueva_reserva, None

def marcar_asistencia(reserva_id, asistio):
    """PBI-06: Administrador marca asistencia (Check-in)."""
    from ..models import Asistencia
    with transaction.atomic():
        try:
            reserva = Reserva.objects.select_for_update().get(pk=reserva_id)
        except Reserva.DoesNotExist:
            return False, "Reserva no encontrada."
        
        # Validar estado actual
        if reserva.estado not in ['Programada', 'Pendiente']:
            return False, f"No se puede marcar asistencia en una reserva con estado '{reserva.estado}'."

        hoy = timezone.localtime(timezone.now()).date()
        if reserva.id_horario.fecha != hoy:
            return False, f"Solo puedes marcar asistencia el mismo día de la reserva (Reserva: {reserva.id_horario.fecha}, Hoy: {hoy})."

        asistencia, created = Asistencia.objects.get_or_create(
            id_reserva=reserva,
            defaults={'asistio': asistio, 'hora_ingreso': timezone.now() if asistio else None}
        )
        if not created:
            asistencia.asistio = asistio
            if asistio and not asistencia.hora_ingreso:
                asistencia.hora_ingreso = timezone.now()
            asistencia.save()
            
        estado_anterior = reserva.estado
        reserva.estado = 'Completada' if asistio else 'No-show'
        reserva.save()

        # Log de asistencia
        try:
            HistorialReserva.objects.create(
                reserva=reserva,
                estado_anterior=estado_anterior,
                estado_nuevo=reserva.estado,
                observacion=f"Asistencia marcada como {'Asistió' if asistio else 'No-show'} por Administrador."
            )
        except:
            pass

        return True, None

def cerrar_dia_reservas():
    """PBI-06: Cron job de cierre de día. 
    Marca como No-Show las reservas pasadas o de hoy que ya terminaron."""
    ahora = timezone.localtime(timezone.now())
    hoy = ahora.date()
    hora_actual = ahora.time()

    # Reservas vencidas (días anteriores o hoy que ya pasaron su hora_fin)
    reservas_vencidas = Reserva.objects.filter(
        Q(id_horario__fecha__lt=hoy) | 
        Q(id_horario__fecha=hoy, id_horario__hora_fin__lt=hora_actual),
        estado__in=['Programada', 'Pendiente']
    )
    
    count = 0
    with transaction.atomic():
        for r in reservas_vencidas:
            estado_ant = r.estado
            r.estado = 'No-show'
            r.save()
            try:
                HistorialReserva.objects.create(
                    reserva=r,
                    estado_anterior=estado_ant,
                    estado_nuevo='No-show',
                    observacion="Cierre automático por horario vencido."
                )
            except:
                pass
            count += 1
    return count

def purgar_pendientes_vencidos():
    """PBI-06: Los alumnos tienen solo 5 minutos para llegar al quórum de 10.
    Si no se llega, las reservas 'Pendiente' expiran."""
    limite = timezone.now() - timedelta(minutes=5)
    
    # Buscamos reservas pendientes creadas hace más de 5 min
    pendientes = Reserva.objects.filter(
        estado='Pendiente',
        created_at__lt=limite
    )
    
    count = 0
    with transaction.atomic():
        for r in pendientes:
            # Solo purgamos si para ese horario NO se llegó a 10
            total_horario = Reserva.objects.filter(id_horario=r.id_horario, estado__in=['Programada', 'Pendiente']).aggregate(total=models.Sum('cantidad_alumnos'))['total'] or 0
            
            if total_horario < 10:
                r.estado = 'Cancelada'
                r.save()
                
                # Liberar capacidad en el horario
                h = r.id_horario
                h.capacidad_ocupada = max(0, h.capacidad_ocupada - 1)
                h.save()

                try:
                    HistorialReserva.objects.create(
                        reserva=r,
                        estado_anterior='Pendiente',
                        estado_nuevo='Cancelada',
                        observacion="Expiración de quórum (Límite 5 minutos superado)."
                    )
                except:
                    pass
                count += 1
    return count
