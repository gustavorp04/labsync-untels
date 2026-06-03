import datetime
import logging
import pytz
from django.db import transaction, models
from django.db.models import Sum, Q
from django.utils import timezone
from datetime import timedelta, datetime as dt_datetime
from ..models import (
    Reserva, HorarioDisponible, ActivoLaboratorio, ReservaDetalle,
    HistorialMantenimiento, Usuario, TipoLaboratorio, HistorialReserva,
    Asistencia, Penalizacion, RecordatorioEnviado,
)

logger = logging.getLogger('reservas')


# =============================================================================
# PBI-11 · RECORDATORIOS AUTOMÁTICOS 24H
# =============================================================================

def enviar_notificacion_email(destinatario_email, asunto, cuerpo):
    """
    Envía un email real utilizando la configuración SMTP de settings.py.
    Lanza excepción si el envío real falla para que el llamador pueda manejarlo.
    """
    from django.conf import settings
    from django.core.mail import send_mail

    logger.info("Enviando email a: %s | Asunto: %s", destinatario_email, asunto)

    send_mail(
        subject=asunto,
        message=cuerpo,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[destinatario_email],
        fail_silently=False,
    )
    logger.info("[EMAIL ENVIADO CON ÉXITO] → %s", destinatario_email)


def enviar_recordatorios_24h():
    """PBI-11: Job de scheduler — envía recordatorios a reservas del día siguiente.

    - Solo envía a reservas Programadas / Pendientes.
    - Usa RecordatorioEnviado (unique_together) para evitar duplicados estrictos.
    - Si el envío falla, registra el error en log y en DB; la reserva queda intacta.
    - Retorna (enviados, errores) para monitoreo.
    """
    lima_tz = pytz.timezone('America/Lima')
    ahora_lima = datetime.datetime.now(tz=lima_tz)
    manana = ahora_lima.date() + timedelta(days=1)

    reservas_manana = (
        Reserva.objects
        .filter(
            id_horario__fecha=manana,
            estado__in=['Programada', 'Pendiente'],
        )
        .exclude(recordatorios__tipo='24h')          # ya tiene recordatorio enviado
        .select_related(
            'id_usuario',
            'id_horario',
            'id_horario__id_laboratorio',
        )
    )

    enviados = 0
    errores = 0

    for reserva in reservas_manana:
        usuario = reserva.id_usuario
        horario = reserva.id_horario
        lab = horario.id_laboratorio

        asunto = "LabSync UNTELS – Recordatorio de reserva para mañana"
        cuerpo = (
            f"Estimado/a {usuario.nombre},\n\n"
            f"Le recordamos que tiene una reserva programada para mañana:\n"
            f"  Laboratorio : {lab.nombre}\n"
            f"  Fecha        : {horario.fecha.strftime('%d/%m/%Y')}\n"
            f"  Horario      : {horario.hora_inicio.strftime('%H:%M')} – "
            f"{horario.hora_fin.strftime('%H:%M')}\n\n"
            f"Preséntese a tiempo o cancele con anticipación.\n"
            f"El incumplimiento genera una penalización de 2 semanas.\n\n"
            f"LabSync UNTELS"
        )

        exitoso = False
        detalle_error = None
        try:
            enviar_notificacion_email(usuario.email, asunto, cuerpo)
            exitoso = True
            enviados += 1
        except Exception as exc:
            detalle_error = str(exc)
            logger.error(
                "PBI-11 | Error al enviar recordatorio para reserva %s: %s",
                reserva.id_reserva, exc
            )
            errores += 1
        finally:
            # Registrar siempre (éxito o fallo) para evitar re-intentos duplicados
            try:
                RecordatorioEnviado.objects.create(
                    id_reserva=reserva,
                    tipo='24h',
                    exitoso=exitoso,
                    detalle_error=detalle_error,
                )
            except Exception as exc_reg:
                logger.error(
                    "PBI-11 | No se pudo registrar recordatorio enviado para reserva %s: %s",
                    reserva.id_reserva, exc_reg
                )

    logger.info(
        "PBI-11 | Recordatorios 24h completados: %d enviados, %d errores.",
        enviados, errores
    )
    return enviados, errores


# =============================================================================
# PBI-07 · PENALIZACIONES POR NO-SHOW
# =============================================================================

SEMANAS_PENALIZACION = 2


def aplicar_penalizacion_noshow(reserva):
    """PBI-07: Crea la penalización de 2 semanas cuando una reserva pasa a No-show.

    - Solo afecta a estudiantes (los docentes no se penalizan).
    - Evita duplicados: usa el OneToOneField de Penalizacion → Reserva.
    - Si el envío de notificación falla, solo registra en log;
      la penalización ya fue creada y la reserva permanece intacta.
    """
    usuario = reserva.id_usuario

    # Solo estudiantes reciben penalización
    if usuario.id_rol.nombre != 'estudiante':
        return

    # Evitar duplicados (OneToOne lo impediría a nivel BD, pero chequeamos antes
    # para no generar una excepción innecesaria).
    if Penalizacion.objects.filter(id_reserva=reserva).exists():
        logger.info(
            "PBI-07 | Penalización ya existente para reserva %s — omitida.",
            reserva.id_reserva
        )
        return

    ahora = timezone.now()
    fecha_fin = ahora + timedelta(weeks=SEMANAS_PENALIZACION)

    try:
        with transaction.atomic():
            pen = Penalizacion.objects.create(
                id_usuario=usuario,
                id_reserva=reserva,
                fecha_inicio=ahora,
                fecha_fin=fecha_fin,
                motivo="No-show: no se presentó a la reserva programada.",
                notificado_expiracion=False,
            )
        logger.info(
            "PBI-07 | Penalización creada para usuario %s (reserva %s) hasta %s.",
            usuario.id_usuario, reserva.id_reserva,
            fecha_fin.strftime('%d/%m/%Y %H:%M')
        )
    except Exception as exc:
        logger.error(
            "PBI-07 | Error al crear penalización para reserva %s: %s",
            reserva.id_reserva, exc
        )
        return  # No lanzar: la reserva ya está en No-show y debe quedar intacta

    # Notificar al estudiante (fallo de notificación no revierte la penalización)
    try:
        _notificar_penalizacion(usuario, pen)
    except Exception as exc:
        logger.error(
            "PBI-07 | Error al enviar notificación de penalización a %s: %s",
            usuario.email, exc
        )


def _notificar_penalizacion(usuario, penalizacion):
    """Simula/envía email de aviso de penalización."""
    asunto = "LabSync UNTELS – Penalización por No-show"
    cuerpo = (
        f"Estimado/a {usuario.nombre},\n\n"
        f"Se ha registrado una infracción por no presentarse a su reserva.\n\n"
        f"  Motivo      : {penalizacion.motivo}\n"
        f"  Inicio      : {penalizacion.fecha_inicio.strftime('%d/%m/%Y %H:%M')}\n"
        f"  Fin         : {penalizacion.fecha_fin.strftime('%d/%m/%Y %H:%M')}\n\n"
        f"Durante este período NO podrá realizar nuevas reservas.\n"
        f"El bloqueo se levanta automáticamente al vencer la fecha indicada.\n\n"
        f"LabSync UNTELS"
    )
    enviar_notificacion_email(usuario.email, asunto, cuerpo)


def notificar_penalizaciones_expiradas():
    """PBI-07: Job de scheduler — detecta penalizaciones recién vencidas
    y envía una notificación de 'penalización levantada' al estudiante.

    Usa el campo `notificado_expiracion` para enviar el aviso solo una vez.
    Retorna la cantidad de notificaciones enviadas.
    """
    ahora = timezone.now()

    vencidas_sin_notificar = Penalizacion.objects.filter(
        fecha_fin__lte=ahora,
        notificado_expiracion=False,
    ).select_related('id_usuario')

    count = 0
    for pen in vencidas_sin_notificar:
        usuario = pen.id_usuario
        asunto = "LabSync UNTELS – Tu penalización ha finalizado"
        cuerpo = (
            f"Estimado/a {usuario.nombre},\n\n"
            f"Tu penalización ha concluido el "
            f"{pen.fecha_fin.strftime('%d/%m/%Y %H:%M')}.\n"
            f"Ya puedes volver a realizar reservas normalmente.\n\n"
            f"LabSync UNTELS"
        )
        try:
            enviar_notificacion_email(usuario.email, asunto, cuerpo)
            pen.notificado_expiracion = True
            pen.save(update_fields=['notificado_expiracion'])
            count += 1
            logger.info(
                "PBI-07 | Notificación de expiración enviada a usuario %s.",
                usuario.id_usuario
            )
        except Exception as exc:
            logger.error(
                "PBI-07 | Error al notificar expiración de penalización %s: %s",
                pen.id_penalizacion, exc
            )

    logger.info("PBI-07 | Penalizaciones expiradas notificadas: %d.", count)
    return count


def recalcular_capacidad(horario):
    """Fuente de verdad: cuenta desde la BD real, no desde el campo."""
    total = Reserva.objects.filter(
        id_horario=horario,
        estado__in=['Programada', 'Pendiente']
    ).aggregate(t=Sum('cantidad_alumnos'))['t'] or 0

    horario.capacidad_ocupada = total
    if total >= horario.capacidad_total:
        horario.estado = 'Completo'
    elif horario.estado == 'Completo':
        horario.estado = 'Disponible'
    horario.save(update_fields=['capacidad_ocupada', 'estado'])


def crear_reserva_docente(usuario, horario, cantidad_alumnos, acepta_dj, activos_ids=None):
    """PBI-03: Docente reserva laboratorio. Abre el lab para co-existencia."""
    with transaction.atomic():
        try:
            horario_db = HorarioDisponible.objects.select_for_update().get(pk=horario.id_horario)
        except HorarioDisponible.DoesNotExist:
            return None, "El horario ya no está disponible."

        if horario_db.estado != 'Disponible':
            return None, "Este horario ya fue reservado o ha alcanzado su capacidad máxima."

        # PBI-20: Validación estricta de aforo dentro del bloqueo concurrente para prevenir race conditions
        if horario_db.capacidad_ocupada + cantidad_alumnos > horario_db.capacidad_total:
            return None, "La cantidad solicitada supera la capacidad disponible en el laboratorio."

        # A-4: Anticipación exacta de 24 horas comparando datetimes completos.
        # La versión anterior comparaba solo fechas (ej.: reservar hoy a las 23:59
        # para mañana a las 00:01 pasaba la validación aunque solo hay 2 minutos).
        ahora = timezone.now()
        naive_inicio = dt_datetime.combine(horario_db.fecha, horario_db.hora_inicio)
        fecha_hora_inicio = timezone.make_aware(naive_inicio, timezone.get_current_timezone())
        if (fecha_hora_inicio - ahora) < timedelta(hours=24):
            return None, "Las reservas deben hacerse con al menos 24 horas de anticipación."

        # A-5: Prevenir traslape real de horario (no solo coincidencia exacta).
        # hora_inicio__lt/hora_fin__gt detecta cualquier superposición de intervalos.
        coincidencias = Reserva.objects.filter(
            id_usuario=usuario,
            estado='Programada',
            id_horario__fecha=horario_db.fecha,
            id_horario__hora_inicio__lt=horario_db.hora_fin,
            id_horario__hora_fin__gt=horario_db.hora_inicio,
        )
        if coincidencias.exists():
            return None, "Ya tienes una reserva programada en este mismo bloque horario."

        # PBI-06: Si hay alumnos en 'Pendiente', el docente tiene prioridad absoluta.
        # Se cancelan las reservas de alumnos para dar paso al docente.
        estudiantes_pendientes = Reserva.objects.filter(id_horario=horario_db, estado='Pendiente')
        if estudiantes_pendientes.exists():
            for r in estudiantes_pendientes:
                estado_anterior = r.estado
                r.estado = 'Cancelada'
                r.save()
                try:
                    HistorialReserva.objects.create(
                        reserva=r,
                        estado_anterior=estado_anterior,
                        estado_nuevo='Cancelada',
                        observacion="Cancelación automática: Prioridad Docente."
                    )
                except Exception as e:
                    logger.error(f"Error al registrar historial al cancelar reserva pendiente: {e}")

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

        # ID-03/09: recalcular_capacidad es la fuente de verdad — suma desde la BD,
        # nunca usa valores en memoria que pueden estar desactualizados.
        recalcular_capacidad(horario_db)
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

        # A-4: Anticipación exacta de 24 horas comparando datetimes completos
        ahora = timezone.now()
        naive_inicio = dt_datetime.combine(horario_db.fecha, horario_db.hora_inicio)
        fecha_hora_inicio = timezone.make_aware(naive_inicio, timezone.get_current_timezone())
        if (fecha_hora_inicio - ahora) < timedelta(hours=24):
            return None, "La reserva debe hacerse con al menos 24 horas de anticipación."

        # A-5: Prevenir traslape real de horario (no solo coincidencia exacta)
        coincidencias = Reserva.objects.filter(
            id_usuario=usuario,
            estado__in=['Programada', 'Pendiente'],
            id_horario__fecha=horario_db.fecha,
            id_horario__hora_inicio__lt=horario_db.hora_fin,
            id_horario__hora_fin__gt=horario_db.hora_inicio,
        )
        if coincidencias.exists():
            return None, "Ya tienes una reserva programada o pendiente en este mismo bloque horario."

        if ReservaDetalle.objects.select_for_update().filter(
            id_activo=activo,
            id_reserva__id_horario=horario_db,
            id_reserva__estado__in=['Programada', 'Pendiente']
        ).exists():
            return None, "El equipo ya está reservado para este horario."

        # PBI-04: Lógica de activación
        docente_presente = Reserva.objects.filter(
            id_horario=horario_db,
            id_usuario__id_rol__nombre='docente',
            estado='Programada'
        ).exists()
        total_interesados = Reserva.objects.filter(
            id_horario=horario_db,
            estado__in=['Programada', 'Pendiente']
        ).aggregate(total=models.Sum('cantidad_alumnos'))['total'] or 0
        nuevo_total = total_interesados + 1

        # Validación de aforo preventivo
        if nuevo_total > horario_db.capacidad_total:
            return None, "El laboratorio ha alcanzado su capacidad máxima para este horario."

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
        recalcular_capacidad(horario_db)
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
        except Exception as e:
            logger.error(f"Error al registrar historial de asistencia: {e}")

        # PBI-07: penalizar al estudiante si no asistió
        if not asistio:
            try:
                aplicar_penalizacion_noshow(reserva)
            except Exception as exc:
                # El error de penalización NO debe revertir el cambio de estado
                logger.error(
                    "PBI-07 | Error inesperado en aplicar_penalizacion_noshow "
                    "para reserva %s: %s", reserva.id_reserva, exc
                )

        return True, None


def cerrar_dia_reservas():
    """PBI-06: Cron job de cierre de día.
    Marca como No-Show las reservas pasadas o de hoy que ya terminaron."""
    ahora = timezone.localtime(timezone.now())
    hoy = ahora.date()
    hora_actual = ahora.time()

    # Reservas vencidas (días anteriores o hoy que ya pasaron su hora_fin)
    # N-01: Evaluar la queryset antes de entrar al bloque atomic para evitar re-evaluaciones
    # y conservar los objetos con el estado correcto si algo falla.
    reservas_vencidas = list(Reserva.objects.filter(
        Q(id_horario__fecha__lt=hoy) |
        Q(id_horario__fecha=hoy, id_horario__hora_fin__lt=hora_actual),
        estado__in=['Programada', 'Pendiente']
    ).select_related('id_usuario', 'id_usuario__id_rol', 'id_horario'))

    ids_procesados = []
    count = 0
    with transaction.atomic():
        for r in reservas_vencidas:
            estado_ant = r.estado
            r.estado = 'No-show'
            r.save()
            ids_procesados.append(r.id_reserva)
            try:
                HistorialReserva.objects.create(
                    reserva=r,
                    estado_anterior=estado_ant,
                    estado_nuevo='No-show',
                    observacion="Cierre automático por horario vencido."
                )
            except Exception as e:
                logger.error(f"Error al registrar cierre de reserva: {e}")
            count += 1

    # PBI-07: aplicar penalización fuera del atomic principal para no revertir
    # los cambios de estado si la penalización falla
    # N-01: Solo penalizar las reservas que efectivamente fueron actualizadas
    for r in reservas_vencidas:
        if r.id_reserva in ids_procesados:
            try:
                aplicar_penalizacion_noshow(r)
            except Exception as exc:
                logger.error(
                    "PBI-07 | Error al aplicar penalización en cierre de día "
                    "para reserva %s: %s", r.id_reserva, exc
                )

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
    emails_quorum = []
    with transaction.atomic():
        for r in pendientes:
            # Solo purgamos si para ese horario NO se llegó a 10
            total_horario = Reserva.objects.filter(
                id_horario=r.id_horario,
                estado__in=['Programada', 'Pendiente']
            ).aggregate(total=models.Sum('cantidad_alumnos'))['total'] or 0

            if total_horario < 10:
                estado_anterior = r.estado
                r.estado = 'Cancelada'
                r.save()

                # PBI-20: Liberar capacidad en el horario usando recalcular bajo un lock
                horario_locked = HorarioDisponible.objects.select_for_update().get(pk=r.id_horario_id)
                recalcular_capacidad(horario_locked)

                try:
                    HistorialReserva.objects.create(
                        reserva=r,
                        estado_anterior=estado_anterior,
                        estado_nuevo='Cancelada',
                        observacion="Expiración de quórum (Límite 5 minutos superado)."
                    )
                except Exception as e:
                    logger.error(f"Error al registrar expiración de reserva pendiente: {e}")

                usuario = r.id_usuario
                if usuario.id_rol.nombre == 'estudiante':
                    h = r.id_horario
                    emails_quorum.append({
                        'email': usuario.email,
                        'nombre_usuario': usuario.nombre,
                        'nombre_lab': h.id_laboratorio.nombre,
                        'fecha_reserva': h.fecha.strftime('%d/%m/%Y'),
                    })
                count += 1

    from .laboratorio_service import enviar_email_quorum_no_alcanzado
    for email_data in emails_quorum:
        enviar_email_quorum_no_alcanzado(
            email=email_data['email'],
            nombre_usuario=email_data['nombre_usuario'],
            nombre_lab=email_data['nombre_lab'],
            fecha_reserva=email_data['fecha_reserva'],
        )

    return count
