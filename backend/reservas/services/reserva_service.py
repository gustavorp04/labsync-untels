from django.db import transaction, models
from django.utils import timezone
from datetime import timedelta
from ..models import (
    Reserva, HorarioDisponible, ActivoLaboratorio, ReservaDetalle,
    HistorialMantenimiento, Usuario, TipoLaboratorio
)

def crear_reserva_docente(usuario, horario, cantidad_alumnos, acepta_dj, activos_ids=None):
    """PBI-03: Docente reserva laboratorio. Abre el lab para co-existencia."""
    with transaction.atomic():
        try:
            horario_db = HorarioDisponible.objects.select_for_update().get(pk=horario.id_horario)
        except HorarioDisponible.DoesNotExist:
            return None, "El horario ya no está disponible."

        if horario_db.estado != 'Disponible':
            return None, "Este horario ya fue reservado o bloqueado."

        if not horario_db.id_laboratorio.habilitado:
            return None, "El laboratorio no cumple con los requisitos mínimos operativos (PBI-02)."

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
            reserva = Reserva.objects.get(pk=reserva_id)
        except Reserva.DoesNotExist:
            return False, "Reserva no encontrada."

        asistencia, created = Asistencia.objects.get_or_create(
            id_reserva=reserva,
            defaults={'asistio': asistio, 'hora_ingreso': timezone.now() if asistio else None}
        )
        if not created:
            asistencia.asistio = asistio
            asistencia.save()
            
        reserva.estado = 'Completada' if asistio else 'No-Show'
        reserva.save()
        return True, None
