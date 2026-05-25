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

        # Liberar capacidad del horario
        horario = reserva.id_horario
        horario.capacidad_ocupada = max(0, (horario.capacidad_ocupada or 0) - 1)
        if horario.estado == 'Completo':
            horario.estado = 'Disponible'
        horario.save()

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


def actualizar_estado_activo(id_activo, nuevo_estado, motivo='Cambio manual', usuario_id=None):
    """Actualiza equipo, recalcula lab (PBI-02) y reasigna (PBI-04). Propaga PBI-12 si el lab se inhabilita."""
    emails_a_enviar = []
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

                # Registro en historial — solo usa el usuario del request
                usuario_registrador = None
                if usuario_id:
                    usuario_registrador = Usuario.objects.filter(pk=usuario_id).first()
                # Si no hay usuario válido, busca el primer admin_lab registrado
                if not usuario_registrador:
                    usuario_registrador = Usuario.objects.filter(id_rol__nombre='admin_lab').first()

                HistorialMantenimiento.objects.create(
                    id_activo=activo,
                    estado_anterior=estado_anterior,
                    estado_nuevo=nuevo_estado,
                    motivo=motivo,
                    fecha_cambio=timezone.now(),
                    registrado_por=usuario_registrador,
                )

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
                                print(f"WARN: Error al registrar historial de cancelación automática: {log_err}")

                            # Liberar capacidad ocupada del horario
                            if horario:
                                horario.capacidad_ocupada = max(0, (horario.capacidad_ocupada or 0) - 1)
                                if horario.estado == 'Completo':
                                    horario.estado = 'Disponible'
                                horario.save()

                            mensajes.append(f"Reserva {horario.fecha} cancelada por falta de equipos operativos libres.")

                success = True
        except Exception as e:
            error_msg = str(e)

    if not success:
        return None, None, [], error_msg

    # Fuera del bloque transaccional atómico se realizan las llamadas de red (SMTP)
    for email_data in emails_a_enviar:
        enviar_email_inhabilitacion(
            email=email_data['email'],
            nombre_usuario=email_data['nombre_usuario'],
            nombre_lab=email_data['nombre_lab'],
            fecha_reserva=email_data['fecha_reserva'],
            motivo=email_data['motivo']
        )

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


def inhabilitar_laboratorio(id_laboratorio, motivo, usuario_id=None):
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

                # Liberar capacidad del horario
                horario = reserva.id_horario
                horario.capacidad_ocupada = max(0, (horario.capacidad_ocupada or 0) - 1)
                if horario.estado == 'Completo':
                    horario.estado = 'Disponible'
                horario.save()

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
            return None, [], str(e)

    # Fuera del bloque transaccional atómico se realizan las llamadas de red (SMTP)
    for email_data in emails_a_enviar:
        enviar_email_inhabilitacion(
            email=email_data['email'],
            nombre_usuario=email_data['nombre_usuario'],
            nombre_lab=email_data['nombre_lab'],
            fecha_reserva=email_data['fecha_reserva'],
            motivo=email_data['motivo']
        )

    return laboratorio, notificados, None