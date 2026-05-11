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
            activo = ActivoLaboratorio.objects.select_related(
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

            # Registro en historial
            usuario_registrador = Usuario.objects.filter(pk=usuario_id).first() or \
                                  Usuario.objects.filter(id_rol__nombre='admin_lab').first() or \
                                  Usuario.objects.first()

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
                hoy = timezone.now().date()
                detalles = ReservaDetalle.objects.filter(
                    id_activo=activo,
                    id_reserva__id_horario__fecha__gte=hoy,
                    id_reserva__estado__in=['Programada', 'Pendiente']
                )
                for d in detalles:
                    horario = d.id_reserva.id_horario
                    ocupados = ReservaDetalle.objects.filter(id_reserva__id_horario=horario).values_list('id_activo', flat=True)
                    libre = ActivoLaboratorio.objects.filter(id_laboratorio=laboratorio, estado='Operativo').exclude(id_activo__in=ocupados).first()
                    
                    if libre:
                        d.id_activo = libre
                        d.save()
                        mensajes.append(f"Reserva {horario.fecha} reasignada a {libre.num_serie}")
                    else:
                        # Si no hay equipo, y el lab se inhabilitó, se cancela automático (PBI-04)
                        if not laboratorio.habilitado:
                            d.id_reserva.estado = 'Cancelada'
                            d.id_reserva.save()
                            mensajes.append(f"Reserva {horario.fecha} cancelada por falta de equipos.")

            return activo, laboratorio, mensajes, None
        except Exception as e:
            return None, None, [], str(e)
