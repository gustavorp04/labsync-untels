from django.db import transaction, models
from django.utils import timezone
from ..models import Laboratorio, ActivoLaboratorio, ReservaDetalle, Reserva, HistorialMantenimiento, Usuario

def calcular_habilitacion_lab(laboratorio):
    """Regla PBI-02: Valida mínimos operativos."""
    tipo = laboratorio.id_tipo
    operativos = ActivoLaboratorio.objects.filter(
        id_laboratorio=laboratorio,
        estado='Operativo',
        id_tipo_activo__nombre=tipo.tipo_equipo_minimo
    ).count()
    
    nuevo_estado = operativos >= tipo.min_equipos
    if laboratorio.habilitado != nuevo_estado:
        laboratorio.habilitado = nuevo_estado
        laboratorio.save()
    return nuevo_estado

def actualizar_estado_activo(id_activo, nuevo_estado, motivo='Cambio manual', usuario_id=None):
    """Actualiza equipo, recalcula lab (PBI-02) y reasigna (PBI-04)."""
    with transaction.atomic():
        try:
            # PBI-04: Para evitar deadlocks relacionales, primero identificamos y bloqueamos los
            # HorariosDisponibles que están asociados con reservas activas para este activo.
            from ..models import HorarioDisponible
            hoy = timezone.now().date()
            horarios_afectados = HorarioDisponible.objects.filter(
                reserva__reservadetalle__id_activo_id=id_activo,
                fecha__gte=hoy,
                reserva__estado__in=['Programada', 'Pendiente']
            ).order_by('id_horario').select_for_update()
            
            # Forzar la ejecución del query para adquirir los bloqueos
            list(horarios_afectados)

            activo = ActivoLaboratorio.objects.select_for_update().select_related(
                'id_laboratorio', 'id_laboratorio__id_tipo'
            ).get(pk=id_activo)

            estado_anterior = activo.estado
            if estado_anterior == nuevo_estado:
                return activo, activo.id_laboratorio, [], None

            activo.estado = nuevo_estado
            activo.save()

            # PBI-02: Recalcular habilitación
            laboratorio = activo.id_laboratorio
            calcular_habilitacion_lab(laboratorio)

            # ID-12: el autor del historial DEBE ser el usuario real que hizo el cambio.
            # No usamos fallback a otro admin para evitar registros de auditoría falsos.
            if not usuario_id:
                return None, None, [], "Se requiere autenticación para modificar el estado de un activo."
            usuario_registrador = Usuario.objects.filter(pk=usuario_id).first()
            if not usuario_registrador:
                return None, None, [], f"Usuario con ID {usuario_id} no encontrado en el sistema."

            HistorialMantenimiento.objects.create(
                id_activo=activo,
                estado_anterior=estado_anterior,
                estado_nuevo=nuevo_estado,
                motivo=motivo,
                fecha_cambio=timezone.now(),
                registrado_por=usuario_registrador,
            )

            mensajes = []
            if nuevo_estado != 'Operativo':
                # PBI-04: Reasignar si el equipo entra en mantenimiento
                detalles = ReservaDetalle.objects.filter(
                    id_activo=activo,
                    id_reserva__id_horario__fecha__gte=hoy,
                    id_reserva__estado__in=['Programada', 'Pendiente']
                )
                for d in detalles:
                    horario = d.id_reserva.id_horario
                    # Filtramos ocupados excluyendo reservas no activas (Canceladas, No-show, Completadas)
                    ocupados = ReservaDetalle.objects.filter(
                        id_reserva__id_horario=horario,
                        id_reserva__estado__in=['Programada', 'Pendiente']
                    ).values_list('id_activo', flat=True)
                    
                    libre = ActivoLaboratorio.objects.filter(id_laboratorio=laboratorio, estado='Operativo').exclude(id_activo__in=ocupados).first()
                    
                    if libre:
                        d.id_activo = libre
                        d.save()
                        mensajes.append(f"Reserva {horario.fecha} reasignada a {libre.num_serie}")
                    else:
                        # Si no hay equipo libre de reemplazo, cancelamos la reserva de forma controlada
                        reserva = d.id_reserva
                        estado_anterior_reserva = reserva.estado
                        reserva.estado = 'Cancelada'
                        reserva.save()
                        
                        # Registrar la cancelación en el historial de reservas
                        try:
                            from ..models import HistorialReserva
                            HistorialReserva.objects.create(
                                reserva=reserva,
                                estado_anterior=estado_anterior_reserva,
                                estado_nuevo='Cancelada',
                                observacion=f"Cancelación automática: Equipo {activo.num_serie} inhabilitado y sin reemplazo operativo libre."
                            )
                        except Exception as log_err:
                            import logging
                            logger = logging.getLogger('reservas')
                            logger.warning("Error al registrar historial de cancelación automática: %s", log_err)

                        # Liberar capacidad ocupada del horario
                        if horario:
                            from .reserva_service import recalcular_capacidad
                            recalcular_capacidad(horario)

                        mensajes.append(f"Reserva {horario.fecha} cancelada por falta de equipos operativos libres.")

            return activo, laboratorio, mensajes, None
        except Exception as e:
            return None, None, [], str(e)
