import logging
import threading
from django.db import transaction, models
from django.utils import timezone
from ..models import Laboratorio, ActivoLaboratorio, ReservaDetalle, Reserva, HistorialMantenimiento, Usuario

logger = logging.getLogger('reservas')


def _enviar_emails_en_segundo_plano(envios):
    """P-1: Dispara el envío SMTP (bloqueante) en un hilo daemon para no
    retener la respuesta HTTP. `envios` es una lista de callables sin argumentos;
    cada uno maneja/loguea sus propios errores."""
    def _worker():
        for enviar in envios:
            try:
                enviar()
            except Exception as exc:
                logger.warning("P-1 | Error al enviar email en segundo plano: %s", exc)

    if not envios:
        return
    threading.Thread(target=_worker, daemon=True).start()

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

def _cancelar_y_notificar_reservas_futuras(laboratorio, motivo):
    """
    Cancela todas las reservas futuras de un laboratorio y recopila la info de correos
    a enviar. Debe ejecutarse dentro de una transacción.
    Retorna (notificados, emails_a_enviar).
    """
    from ..models import Reserva, HistorialReserva, HorarioDisponible
    hoy = timezone.now().date()
    reservas_afectadas = Reserva.objects.select_for_update().filter(
        id_horario__id_laboratorio=laboratorio,
        id_horario__fecha__gte=hoy,
        estado__in=['Programada', 'Pendiente']
    ).select_related('id_usuario', 'id_horario', 'id_horario__id_laboratorio')

    from .reserva_service import recalcular_capacidad

    notificados = []
    emails_a_enviar = []
    for reserva in reservas_afectadas:
        estado_anterior = reserva.estado
        reserva.estado = 'Cancelada'
        reserva.save()

        # Registrar en historial
        HistorialReserva.objects.create(
            reserva=reserva,
            estado_anterior=estado_anterior,
            estado_nuevo='Cancelada',
            observacion=f"Cancelación automática PBI-12: Laboratorio inhabilitado. Motivo: {motivo}"
        )

        # L-3: liberar capacidad usando la fuente de verdad (conteo real) bajo lock,
        # en vez de un decremento manual que puede divergir.
        horario = HorarioDisponible.objects.select_for_update().get(pk=reserva.id_horario_id)
        recalcular_capacidad(horario)

        usuario = reserva.id_usuario
        emails_a_enviar.append({
            'email': usuario.email,
            'nombre_usuario': usuario.nombre,
            'nombre_lab': laboratorio.nombre,
            'fecha_reserva': horario.fecha.strftime('%d/%m/%Y'),
            'motivo': motivo
        })
        notificados.append(usuario.email)
        
    return notificados, emails_a_enviar


def actualizar_estado_activo(id_activo, nuevo_estado, motivo='Cambio manual', usuario_id=None, id_incidencia=None, imagen=None):
    """Actualiza equipo, recalcula lab (PBI-02) y reasigna (PBI-04). Propaga PBI-12 si el lab se inhabilita."""
    emails_a_enviar = []
    emails_pc_reasignada = []
    emails_pc_cancelada = []
    emails_pc_docente_inhabilitada = []
    mensajes = []
    success = False
    error_msg = None

    # Declarar variables que se asignarán dentro de la transacción
    activo = None
    laboratorio = None

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
                success = True
            else:
                activo.estado = nuevo_estado
                activo.save()

                # PBI-02: Recalcular habilitación
                laboratorio = activo.id_laboratorio
                anterior_habilitado = laboratorio.habilitado
                nuevo_estado_lab = calcular_habilitacion_lab(laboratorio)

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
                    id_incidencia=id_incidencia,
                    fecha_cambio=timezone.now(),
                    registrado_por=usuario_registrador,
                    imagen=imagen,
                )

                mensajes = []

                # PBI-12: Si el laboratorio se inhabilitó automáticamente debido a esta falla de equipo
                if anterior_habilitado and not nuevo_estado_lab:
                    motivo_cancelacion = f"Falla de equipo crítico: {activo.num_serie} ({activo.id_tipo_activo.nombre}). Motivo: {motivo}"
                    notificados, emails_de_lab = _cancelar_y_notificar_reservas_futuras(laboratorio, motivo_cancelacion)
                    emails_a_enviar.extend(emails_de_lab)
                    mensajes.append(f"Laboratorio {laboratorio.nombre} inhabilitado automáticamente y se cancelaron {len(notificados)} reservas futuras.")
                elif nuevo_estado != 'Operativo':
                    # PBI-04: Reasignar si el equipo entra en mantenimiento y el lab sigue habilitado
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
                            usuario = d.id_reserva.id_usuario
                            # Notificar siempre si se reasigna
                            emails_pc_reasignada.append({
                                'email': usuario.email,
                                'nombre_usuario': usuario.nombre,
                                'num_serie_original': activo.num_serie,
                                'codigo_patrimonio_original': activo.codigo_patrimonio,
                                'codigo_patrimonio_nuevo': libre.codigo_patrimonio,
                                'fecha_reserva': horario.fecha.strftime('%d/%m/%Y'),
                            })
                        else:
                            usuario = d.id_reserva.id_usuario
                            reserva = d.id_reserva
                            
                            if usuario.id_rol.nombre == 'estudiante':
                                # Si no hay equipo libre de reemplazo para un estudiante, se cancela
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
                                emails_pc_cancelada.append({
                                    'email': usuario.email,
                                    'nombre_usuario': usuario.nombre,
                                    'num_serie_original': activo.num_serie,
                                    'fecha_reserva': horario.fecha.strftime('%d/%m/%Y') if horario else 'Desconocida',
                                })
                            else:
                                # Para docentes, si falla 1 PC, NO cancelamos la reserva entera.
                                # Solo eliminamos el detalle de esa PC para liberar la relación.
                                d.delete()
                                mensajes.append(f"PC {activo.num_serie} removida de la reserva docente {horario.fecha}.")
                                emails_pc_docente_inhabilitada.append({
                                    'email': usuario.email,
                                    'nombre_usuario': usuario.nombre,
                                    'num_serie_original': activo.num_serie,
                                    'fecha_reserva': horario.fecha.strftime('%d/%m/%Y') if horario else 'Desconocida',
                                    'nombre_lab': laboratorio.nombre
                                })

                success = True
        except Exception as e:
            # S-4 (CWE-209): registrar el detalle, devolver mensaje genérico.
            logger.error("Error al actualizar estado del activo %s: %s", id_activo, e, exc_info=True)
            error_msg = "No se pudo actualizar el estado del equipo. Intente más tarde."

    if not success:
        return None, None, [], error_msg

    # P-1: el envío SMTP (bloqueante) se hace fuera de la transacción y en
    # segundo plano para no retener la respuesta HTTP cuando hay muchos correos.
    envios = []
    for email_data in emails_a_enviar:
        envios.append(lambda d=email_data: enviar_email_inhabilitacion(
            email=d['email'], nombre_usuario=d['nombre_usuario'], nombre_lab=d['nombre_lab'],
            fecha_reserva=d['fecha_reserva'], motivo=d['motivo']))
    for email_data in emails_pc_reasignada:
        envios.append(lambda d=email_data: enviar_email_pc_reasignada(
            email=d['email'], nombre_usuario=d['nombre_usuario'],
            num_serie_original=d['num_serie_original'],
            codigo_patrimonio_original=d['codigo_patrimonio_original'],
            codigo_patrimonio_nuevo=d['codigo_patrimonio_nuevo'],
            fecha_reserva=d['fecha_reserva']))
    for email_data in emails_pc_cancelada:
        envios.append(lambda d=email_data: enviar_email_reserva_cancelada_sin_reemplazo(
            email=d['email'], nombre_usuario=d['nombre_usuario'],
            num_serie_original=d['num_serie_original'], fecha_reserva=d['fecha_reserva']))
    for email_data in emails_pc_docente_inhabilitada:
        envios.append(lambda d=email_data: enviar_email_pc_docente_inhabilitada(
            email=d['email'], nombre_usuario=d['nombre_usuario'],
            num_serie_original=d['num_serie_original'], fecha_reserva=d['fecha_reserva'],
            nombre_lab=d['nombre_lab']))
    _enviar_emails_en_segundo_plano(envios)

    # Si el estado es el mismo, el laboratorio de retorno se toma del activo
    lab_retorno = laboratorio if laboratorio else (activo.id_laboratorio if activo else None)
    return activo, lab_retorno, mensajes, None


# =============================================================================
# PBI-12 — Notificación de inhabilitación de laboratorio
# =============================================================================

def enviar_email_inhabilitacion(email, nombre_usuario, nombre_lab, fecha_reserva, motivo):
    """Envía email al titular de una reserva cancelada por inhabilitación del laboratorio."""
    from django.core.mail import EmailMultiAlternatives
    from django.conf import settings

    subject = f"LabSync — Tu reserva en {nombre_lab} ha sido cancelada"
    text_content = (
        f"Hola {nombre_usuario},\n\n"
        f"Tu reserva del {fecha_reserva} en {nombre_lab} fue cancelada automáticamente "
        f"porque el laboratorio fue inhabilitado.\n\nMotivo: {motivo}\n\n"
        f"Por favor, realiza una nueva reserva en otro laboratorio disponible.\n\nEquipo LabSync UNTELS"
    )
    html_content = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;
                border: 1px solid #ddd; border-radius: 10px; padding: 24px;">
        <h2 style="color: #d32f2f;">⚠️ Reserva Cancelada — {nombre_lab}</h2>
        <p>Hola <strong>{nombre_usuario}</strong>,</p>
        <p>Tu reserva ha sido <strong>cancelada automáticamente</strong> porque el laboratorio
        fue inhabilitado por el administrador.</p>
        <table style="width:100%; border-collapse: collapse; margin: 16px 0;">
            <tr style="background:#f5f5f5;">
                <td style="padding:8px; border:1px solid #ddd;"><strong>Laboratorio</strong></td>
                <td style="padding:8px; border:1px solid #ddd;">{nombre_lab}</td>
            </tr>
            <tr>
                <td style="padding:8px; border:1px solid #ddd;"><strong>Fecha reservada</strong></td>
                <td style="padding:8px; border:1px solid #ddd;">{fecha_reserva}</td>
            </tr>
            <tr style="background:#f5f5f5;">
                <td style="padding:8px; border:1px solid #ddd;"><strong>Motivo</strong></td>
                <td style="padding:8px; border:1px solid #ddd;">{motivo}</td>
            </tr>
        </table>
        <p>Por favor, realiza una nueva reserva en otro laboratorio disponible.</p>
        <p style="color:#888; font-size:12px;">Este es un mensaje automático de LabSync UNTELS.</p>
    </div>
    """
    try:
        msg = EmailMultiAlternatives(subject, text_content, settings.EMAIL_HOST_USER, [email])
        msg.attach_alternative(html_content, "text/html")
        msg.send()
    except Exception as e:
        print(f"WARN: No se pudo enviar email a {email}: {e}")


def enviar_email_pc_reasignada(email, nombre_usuario, num_serie_original, codigo_patrimonio_original, codigo_patrimonio_nuevo, fecha_reserva):
    """Envía email al titular cuando su PC fue inhabilitada y se le asignó una PC de reemplazo automáticamente."""
    from django.core.mail import EmailMultiAlternatives
    from django.conf import settings

    subject = "LabSync — Tu PC fue reemplazada automáticamente"
    text_content = (
        f"Hola {nombre_usuario},\n\n"
        f"Tu PC original (N/S: {num_serie_original} / Patrimonio: {codigo_patrimonio_original}) "
        f"fue inhabilitada para tu reserva del {fecha_reserva}. "
        f"Se te ha asignado automáticamente una PC de reemplazo (Patrimonio: {codigo_patrimonio_nuevo}).\n\n"
        f"Tu reserva sigue vigente. No necesitas realizar ninguna acción adicional.\n\nEquipo LabSync UNTELS"
    )
    html_content = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;
                border: 1px solid #ddd; border-radius: 10px; padding: 24px;">
        <h2 style="color: #f57c00;">&#x1F504; PC Reemplazada — Reserva Actualizada</h2>
        <p>Hola <strong>{nombre_usuario}</strong>,</p>
        <p>La PC asignada a tu reserva del <strong>{fecha_reserva}</strong> fue <strong>inhabilitada</strong>.
        Se te ha asignado automáticamente una PC de reemplazo.</p>
        <table style="width:100%; border-collapse: collapse; margin: 16px 0;">
            <tr style="background:#f5f5f5;">
                <td style="padding:8px; border:1px solid #ddd;"><strong>PC original (N/S)</strong></td>
                <td style="padding:8px; border:1px solid #ddd;">{num_serie_original}</td>
            </tr>
            <tr>
                <td style="padding:8px; border:1px solid #ddd;"><strong>PC original (Patrimonio)</strong></td>
                <td style="padding:8px; border:1px solid #ddd;">{codigo_patrimonio_original}</td>
            </tr>
            <tr style="background:#f5f5f5;">
                <td style="padding:8px; border:1px solid #ddd;"><strong>PC asignada (Patrimonio)</strong></td>
                <td style="padding:8px; border:1px solid #ddd;"><strong style="color:#2e7d32;">{codigo_patrimonio_nuevo}</strong></td>
            </tr>
        </table>
        <p>Tu reserva sigue vigente. No necesitas realizar ninguna acción adicional.</p>
        <p style="color:#888; font-size:12px;">Este es un mensaje automático de LabSync UNTELS.</p>
    </div>
    """
    try:
        msg = EmailMultiAlternatives(subject, text_content, settings.EMAIL_HOST_USER, [email])
        msg.attach_alternative(html_content, "text/html")
        msg.send()
    except Exception as e:
        print(f"WARN: No se pudo enviar email a {email}: {e}")


def enviar_email_reserva_cancelada_sin_reemplazo(email, nombre_usuario, num_serie_original, fecha_reserva):
    """Envía email al titular cuando su reserva fue cancelada porque su PC entró en mantenimiento sin equipo de reemplazo."""
    from django.core.mail import EmailMultiAlternatives
    from django.conf import settings

    subject = "LabSync — Tu reserva fue cancelada por mantenimiento de equipo"
    text_content = (
        f"Hola {nombre_usuario},\n\n"
        f"Tu reserva del {fecha_reserva} fue cancelada automáticamente porque la PC asignada "
        f"(N/S: {num_serie_original}) entró en mantenimiento y no hay equipos de reemplazo disponibles.\n\n"
        f"Puedes ingresar al sistema para realizar una nueva reserva.\n\nEquipo LabSync UNTELS"
    )
    html_content = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;
                border: 1px solid #ddd; border-radius: 10px; padding: 24px;">
        <h2 style="color: #d32f2f;">&#x26A0;&#xFE0F; Reserva Cancelada — Equipo en Mantenimiento</h2>
        <p>Hola <strong>{nombre_usuario}</strong>,</p>
        <p>Tu reserva fue <strong>cancelada automáticamente</strong> porque la PC asignada
        entró en mantenimiento y no hay equipos de reemplazo disponibles.</p>
        <table style="width:100%; border-collapse: collapse; margin: 16px 0;">
            <tr style="background:#f5f5f5;">
                <td style="padding:8px; border:1px solid #ddd;"><strong>PC afectada (N/S)</strong></td>
                <td style="padding:8px; border:1px solid #ddd;">{num_serie_original}</td>
            </tr>
            <tr>
                <td style="padding:8px; border:1px solid #ddd;"><strong>Fecha reservada</strong></td>
                <td style="padding:8px; border:1px solid #ddd;">{fecha_reserva}</td>
            </tr>
        </table>
        <p>Puedes ingresar al sistema para realizar una nueva reserva en otro horario disponible.</p>
        <p style="color:#888; font-size:12px;">Este es un mensaje automático de LabSync UNTELS.</p>
    </div>
    """
    try:
        msg = EmailMultiAlternatives(subject, text_content, settings.EMAIL_HOST_USER, [email])
        msg.attach_alternative(html_content, "text/html")
        msg.send()
    except Exception as e:
        print(f"WARN: No se pudo enviar email a {email}: {e}")


def enviar_email_pc_docente_inhabilitada(email, nombre_usuario, num_serie_original, fecha_reserva, nombre_lab):
    """Envía email al docente titular cuando una PC de su clase fue inhabilitada y no hay reemplazos."""
    from django.core.mail import EmailMultiAlternatives
    from django.conf import settings

    subject = f"LabSync — Equipo inhabilitado en tu reserva de {nombre_lab}"
    text_content = (
        f"Hola {nombre_usuario},\n\n"
        f"Te informamos que un equipo de tu reserva para el {fecha_reserva} en {nombre_lab} "
        f"(N/S: {num_serie_original}) ha sido inhabilitado por mantenimiento y no hay equipos de reemplazo disponibles.\n\n"
        f"Tu reserva general sigue vigente y puedes realizar tu clase con normalidad usando el resto de los equipos operativos.\n\n"
        f"Equipo LabSync UNTELS"
    )
    html_content = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;
                border: 1px solid #ddd; border-radius: 10px; padding: 24px;">
        <h2 style="color: #f57c00;">&#x26A0;&#xFE0F; Equipo en Mantenimiento — Reserva Vigente</h2>
        <p>Hola <strong>{nombre_usuario}</strong>,</p>
        <p>Te informamos que un equipo de tu reserva ha sido <strong>inhabilitado por mantenimiento</strong> y no hay unidades de reemplazo disponibles en este momento.</p>
        <table style="width:100%; border-collapse: collapse; margin: 16px 0;">
            <tr style="background:#f5f5f5;">
                <td style="padding:8px; border:1px solid #ddd;"><strong>Laboratorio</strong></td>
                <td style="padding:8px; border:1px solid #ddd;">{nombre_lab}</td>
            </tr>
            <tr>
                <td style="padding:8px; border:1px solid #ddd;"><strong>Equipo afectado (N/S)</strong></td>
                <td style="padding:8px; border:1px solid #ddd;">{num_serie_original}</td>
            </tr>
            <tr style="background:#f5f5f5;">
                <td style="padding:8px; border:1px solid #ddd;"><strong>Fecha reservada</strong></td>
                <td style="padding:8px; border:1px solid #ddd;">{fecha_reserva}</td>
            </tr>
        </table>
        <p><strong>Importante:</strong> Tu reserva general de laboratorio <strong style="color:#2e7d32;">sigue vigente</strong>. Puedes dictar tu clase con normalidad utilizando los demás equipos operativos del aula.</p>
        <p style="color:#888; font-size:12px;">Este es un mensaje automático de LabSync UNTELS.</p>
    </div>
    """
    try:
        msg = EmailMultiAlternatives(subject, text_content, settings.EMAIL_HOST_USER, [email])
        msg.attach_alternative(html_content, "text/html")
        msg.send()
    except Exception as e:
        print(f"WARN: No se pudo enviar email a {email}: {e}")



def enviar_email_quorum_no_alcanzado(email, nombre_usuario, nombre_lab, fecha_reserva):
    """Envía email al titular cuando su reserva fue cancelada por no alcanzar el quórum mínimo de 10 alumnos."""
    from django.core.mail import EmailMultiAlternatives
    from django.conf import settings

    subject = f"LabSync — Tu reserva en {nombre_lab} no se concretó"
    text_content = (
        f"Hola {nombre_usuario},\n\n"
        f"Tu reserva del {fecha_reserva} en {nombre_lab} no se concretó porque no se alcanzó "
        f"el mínimo de 10 alumnos requerido para abrir el laboratorio.\n\n"
        f"Puedes ingresar al sistema para realizar una nueva reserva.\n\nEquipo LabSync UNTELS"
    )
    html_content = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;
                border: 1px solid #ddd; border-radius: 10px; padding: 24px;">
        <h2 style="color: #1565c0;">&#x2139;&#xFE0F; Reserva No Concretada — Quórum Insuficiente</h2>
        <p>Hola <strong>{nombre_usuario}</strong>,</p>
        <p>Tu reserva no se concretó porque no se alcanzó el <strong>mínimo de 10 alumnos</strong>
        requerido para abrir el laboratorio.</p>
        <table style="width:100%; border-collapse: collapse; margin: 16px 0;">
            <tr style="background:#f5f5f5;">
                <td style="padding:8px; border:1px solid #ddd;"><strong>Laboratorio</strong></td>
                <td style="padding:8px; border:1px solid #ddd;">{nombre_lab}</td>
            </tr>
            <tr>
                <td style="padding:8px; border:1px solid #ddd;"><strong>Fecha reservada</strong></td>
                <td style="padding:8px; border:1px solid #ddd;">{fecha_reserva}</td>
            </tr>
        </table>
        <p>Puedes ingresar al sistema para realizar una nueva reserva en otro horario disponible.</p>
        <p style="color:#888; font-size:12px;">Este es un mensaje automático de LabSync UNTELS.</p>
    </div>
    """
    try:
        msg = EmailMultiAlternatives(subject, text_content, settings.EMAIL_HOST_USER, [email])
        msg.attach_alternative(html_content, "text/html")
        msg.send()
    except Exception as e:
        print(f"WARN: No se pudo enviar email a {email}: {e}")


def enviar_email_incidencia(email, nombre_usuario, nombre_lab, num_serie, codigo_patrimonio, descripcion_dano, estado_activo_post):
    """Notifica al último usuario responsable que se registró una incidencia en el equipo que usó."""
    from django.core.mail import EmailMultiAlternatives
    from django.conf import settings

    subject = f"LabSync — Incidencia registrada en equipo que usaste en {nombre_lab}"
    text_content = (
        f"Hola {nombre_usuario},\n\n"
        f"Se ha registrado una incidencia en el equipo que usaste en el laboratorio {nombre_lab}.\n\n"
        f"Equipo: N/S {num_serie} / Patrimonio {codigo_patrimonio}\n"
        f"Daño reportado: {descripcion_dano}\n"
        f"Nuevo estado del equipo: {estado_activo_post}\n\n"
        f"El administrador del laboratorio ha tomado nota del incidente.\n\nEquipo LabSync UNTELS"
    )
    html_content = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;
                border: 1px solid #ddd; border-radius: 10px; padding: 24px;">
        <h2 style="color: #d32f2f;">&#x1F6A8; Incidencia Registrada — {nombre_lab}</h2>
        <p>Hola <strong>{nombre_usuario}</strong>,</p>
        <p>Se ha registrado una incidencia en el equipo que utilizaste en el laboratorio
        <strong>{nombre_lab}</strong>. El administrador del laboratorio ha tomado nota del incidente.</p>
        <table style="width:100%; border-collapse: collapse; margin: 16px 0;">
            <tr style="background:#f5f5f5;">
                <td style="padding:8px; border:1px solid #ddd;"><strong>Laboratorio</strong></td>
                <td style="padding:8px; border:1px solid #ddd;">{nombre_lab}</td>
            </tr>
            <tr>
                <td style="padding:8px; border:1px solid #ddd;"><strong>Número de serie</strong></td>
                <td style="padding:8px; border:1px solid #ddd;">{num_serie}</td>
            </tr>
            <tr style="background:#f5f5f5;">
                <td style="padding:8px; border:1px solid #ddd;"><strong>Código patrimonio</strong></td>
                <td style="padding:8px; border:1px solid #ddd;">{codigo_patrimonio}</td>
            </tr>
            <tr>
                <td style="padding:8px; border:1px solid #ddd;"><strong>Daño reportado</strong></td>
                <td style="padding:8px; border:1px solid #ddd;">{descripcion_dano}</td>
            </tr>
            <tr style="background:#f5f5f5;">
                <td style="padding:8px; border:1px solid #ddd;"><strong>Nuevo estado del equipo</strong></td>
                <td style="padding:8px; border:1px solid #ddd;"><strong style="color:#d32f2f;">{estado_activo_post}</strong></td>
            </tr>
        </table>
        <p>El administrador del laboratorio ha tomado nota del incidente. Si tienes alguna consulta,
        puedes comunicarte con el área de soporte de tu institución.</p>
        <p style="color:#888; font-size:12px;">Este es un mensaje automático de LabSync UNTELS.</p>
    </div>
    """
    try:
        msg = EmailMultiAlternatives(subject, text_content, settings.EMAIL_HOST_USER, [email])
        msg.attach_alternative(html_content, "text/html")
        msg.send()
    except Exception as e:
        print(f"WARN: No se pudo enviar email a {email}: {e}")


def inhabilitar_laboratorio(id_laboratorio, motivo, usuario_id=None, imagen=None):
    """
    PBI-12: Inhabilita manualmente un laboratorio, cancela todas sus reservas
    futuras y notifica por email a los titulares afectados.
    """
    from ..models import Reserva, HistorialReserva, HorarioDisponible

    emails_a_enviar = []
    notificados = []

    with transaction.atomic():
        try:
            laboratorio = Laboratorio.objects.select_for_update().get(pk=id_laboratorio)

            if not laboratorio.habilitado:
                return laboratorio, [], "El laboratorio ya estaba inhabilitado."

            laboratorio.habilitado = False
            if imagen is not None:
                laboratorio.imagen_inhabilitacion = imagen
            laboratorio.save()

            hoy = timezone.now().date()

            # Buscar todas las reservas futuras activas en este laboratorio
            reservas_afectadas = Reserva.objects.select_for_update().filter(
                id_horario__id_laboratorio=laboratorio,
                id_horario__fecha__gte=hoy,
                estado__in=['Programada', 'Pendiente']
            ).select_related('id_usuario', 'id_horario', 'id_horario__id_laboratorio')

            for reserva in reservas_afectadas:
                estado_anterior = reserva.estado
                reserva.estado = 'Cancelada'
                reserva.save()

                # Registrar en historial
                HistorialReserva.objects.create(
                    reserva=reserva,
                    estado_anterior=estado_anterior,
                    estado_nuevo='Cancelada',
                    observacion=f"Cancelación automática PBI-12: Laboratorio inhabilitado. Motivo: {motivo}"
                )

                # L-3: liberar capacidad usando la fuente de verdad (conteo real) bajo lock.
                from .reserva_service import recalcular_capacidad
                horario = HorarioDisponible.objects.select_for_update().get(pk=reserva.id_horario_id)
                recalcular_capacidad(horario)

                # Recopilar datos del destinatario para envío fuera de la transacción
                usuario = reserva.id_usuario
                emails_a_enviar.append({
                    'email': usuario.email,
                    'nombre_usuario': usuario.nombre,
                    'nombre_lab': laboratorio.nombre,
                    'fecha_reserva': horario.fecha.strftime('%d/%m/%Y'),
                    'motivo': motivo
                })
                notificados.append(usuario.email)

        except Laboratorio.DoesNotExist:
            return None, [], "Laboratorio no encontrado."
        except Exception as e:
            # S-4 (CWE-209): registrar el detalle, devolver mensaje genérico.
            logger.error("Error al inhabilitar laboratorio %s: %s", id_laboratorio, e, exc_info=True)
            return None, [], "No se pudo inhabilitar el laboratorio. Intente más tarde."

    # P-1: envío SMTP en segundo plano para no bloquear la respuesta HTTP.
    _enviar_emails_en_segundo_plano([
        (lambda d=email_data: enviar_email_inhabilitacion(
            email=d['email'], nombre_usuario=d['nombre_usuario'], nombre_lab=d['nombre_lab'],
            fecha_reserva=d['fecha_reserva'], motivo=d['motivo']))
        for email_data in emails_a_enviar
    ])

    return laboratorio, notificados, None


def registrar_incidencia(id_activo, descripcion_dano, estado_activo_post, registrado_por, imagen=None):
    """
    PBI-22: Registra una incidencia para un equipo activo.
    Busca automáticamente el último usuario que tuvo una reserva Completada o Asistió
    en ese equipo específico, vincula la incidencia a ese detalle, actualiza el estado
    del activo y recalcula el estado de habilitación del laboratorio.
    """
    from ..models import ReservaDetalle, Incidencia, ActivoLaboratorio, Usuario
    from django.db.models import Q
    from django.utils import timezone

    try:
        activo = ActivoLaboratorio.objects.get(pk=id_activo)
    except ActivoLaboratorio.DoesNotExist:
        return None, None, "El activo especificado no existe."

    # Buscar el usuario de registro
    try:
        usuario_registrador = Usuario.objects.get(pk=registrado_por)
    except Usuario.DoesNotExist:
        return None, None, f"Usuario registrador con ID {registrado_por} no encontrado."

    # Buscar la última reserva completada o asistida para esta PC
    detalle = ReservaDetalle.objects.filter(
        id_activo=id_activo
    ).filter(
        Q(id_reserva__estado='Completada') | Q(id_reserva__asistencia__asistio=True)
    ).select_related('id_reserva', 'id_reserva__id_usuario', 'id_reserva__id_horario').order_by(
        '-id_reserva__id_horario__fecha',
        '-id_reserva__id_horario__hora_inicio',
        '-id_reserva__created_at'
    ).first()

    if not detalle:
        return None, None, "No se encontró ninguna reserva Completada o Asistió para esta PC en el sistema, por lo que no se puede vincular un usuario responsable."

    usuario_responsable = detalle.id_reserva.id_usuario

    email_incidencia_data = None

    with transaction.atomic():
        try:
            # Crear el registro en Incidencia
            incidencia = Incidencia.objects.create(
                id_detalle=detalle,
                id_activo=activo,
                descripcion_dano=descripcion_dano,
                fecha_reporte=timezone.now(),
                estado_activo_post=estado_activo_post,
                imagen=imagen,
            )

            # Llamar a actualizar_estado_activo para cambiar el estado, reasignar reservas futuras
            # y actualizar el estado de habilitación del laboratorio
            activo_actualizado, lab_retorno, mensajes, error_maint = actualizar_estado_activo(
                id_activo=id_activo,
                nuevo_estado=estado_activo_post,
                motivo=f"Incidencia reportada: {descripcion_dano}",
                usuario_id=registrado_por,
                id_incidencia=incidencia # Pasar el objeto incidencia para vincularlo en el HistorialMantenimiento
            )

            if error_maint:
                raise Exception(error_maint)

            # Recopilar datos para el email; se enviará fuera de la transacción
            email_incidencia_data = {
                'email': usuario_responsable.email,
                'nombre_usuario': usuario_responsable.nombre,
                'nombre_lab': lab_retorno.nombre if lab_retorno else activo.id_laboratorio.nombre,
                'num_serie': activo.num_serie,
                'codigo_patrimonio': activo.codigo_patrimonio,
                'descripcion_dano': descripcion_dano,
                'estado_activo_post': estado_activo_post,
            }

        except Exception as e:
            return None, None, f"Error al procesar la incidencia: {str(e)}"

    # Fuera del bloque transaccional atómico se realizan las llamadas de red (SMTP)
    if email_incidencia_data:
        enviar_email_incidencia(**email_incidencia_data)

    return incidencia, usuario_responsable, None