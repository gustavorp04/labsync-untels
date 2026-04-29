from django.db import transaction
from django.utils import timezone
from ..models import Laboratorio, ActivoLaboratorio, ReservaDetalle, Reserva

def actualizar_estado_activo(id_activo, nuevo_estado):
    """
    Actualiza el estado de un equipo (PC/Mesa) y recalcula la disponibilidad del laboratorio.
    Regla PBI-02: El laboratorio solo pasa a estado "Disponible" (habilitado=True) 
    si tiene más de 10 PCs (Computación) o al menos 3 mesas (Ambiental/Electrónica).
    """
    with transaction.atomic():
        try:
            # 1. Actualizar el estado del equipo
            activo = ActivoLaboratorio.objects.select_related('id_laboratorio', 'id_laboratorio__id_tipo').get(pk=id_activo)
            activo.estado = nuevo_estado
            activo.save()

            # 2. Evaluar el estado del laboratorio
            laboratorio = activo.id_laboratorio
            tipo_lab = laboratorio.id_tipo
            min_equipos = tipo_lab.min_equipos
            tipo_equipo_requerido = tipo_lab.tipo_equipo_minimo

            # Contar cuántos equipos operativos del tipo requerido hay en ese laboratorio
            equipos_operativos = ActivoLaboratorio.objects.filter(
                id_laboratorio=laboratorio,
                id_tipo_activo__nombre__icontains=tipo_equipo_requerido,
                estado='Operativo'
            ).count()

            # 3. Aplicar regla de negocio
            estado_anterior = laboratorio.habilitado
            if equipos_operativos >= min_equipos:
                laboratorio.habilitado = True
            else:
                laboratorio.habilitado = False
            
            laboratorio.save()

            # 4. PBI-02: Reasignar reservas si el equipo falló
            mensajes_reasignacion = []
            if nuevo_estado != 'Operativo':
                hoy = timezone.now().date()
                detalles_afectados = ReservaDetalle.objects.filter(
                    id_activo=activo,
                    id_reserva__id_horario__fecha__gte=hoy,
                    id_reserva__estado='Confirmada'
                ).select_related('id_reserva', 'id_reserva__id_horario')

                for detalle in detalles_afectados:
                    horario = detalle.id_reserva.id_horario
                    
                    # Buscar un equipo operativo en el mismo lab que NO esté reservado en este horario
                    equipos_ocupados_horario = ReservaDetalle.objects.filter(
                        id_reserva__id_horario=horario
                    ).values_list('id_activo', flat=True)

                    equipo_libre = ActivoLaboratorio.objects.filter(
                        id_laboratorio=laboratorio,
                        estado='Operativo'
                    ).exclude(id_activo__in=equipos_ocupados_horario).first()

                    if equipo_libre:
                        detalle.id_activo = equipo_libre
                        detalle.save()
                        mensajes_reasignacion.append(f"Reserva de fecha {horario.fecha} movida al equipo {equipo_libre.num_serie}")
                    else:
                        mensajes_reasignacion.append(f"ADVERTENCIA: No hay equipos libres para reasignar la reserva del {horario.fecha}")

            return activo, laboratorio, mensajes_reasignacion, None

        except ActivoLaboratorio.DoesNotExist:
            return None, None, [], "El equipo especificado no existe."
        except Exception as e:
            return None, None, [], str(e)
