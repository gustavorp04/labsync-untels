import re
import hashlib
from django.contrib.auth.hashers import check_password, make_password
from django.utils.crypto import get_random_string
from django.core.mail import EmailMultiAlternatives
from django.conf import settings
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.utils import timezone
from datetime import timedelta
from ..models import Usuario, PasswordReset

def autenticar_usuario(codigo_universitario, password, rol_nombre):
    try:
        user = Usuario.objects.get(codigo_universitario=codigo_universitario)
        password_ok = check_password(password, user.password_hash)
    except Usuario.DoesNotExist:
        # PBI-18: Prevención de timing attacks (usar un número entero válido para las iteraciones)
        check_password(password, 'pbkdf2_sha256$100000$dummy$dummy')
        return None, "Credenciales inválidas"
        
    if not password_ok:
        return None, "Credenciales inválidas"
    if user.id_rol.nombre != rol_nombre:
        return None, "Credenciales inválidas"
    return user, None

def solicitar_recuperacion_password(email):
    try:
        user = Usuario.objects.get(email=email)
        token = get_random_string(6).upper()
        token_hashed = hashlib.sha256(token.encode('utf-8')).hexdigest()
        
        # Limpiar antiguos y crear nuevo
        PasswordReset.objects.filter(id_usuario=user).delete()
        PasswordReset.objects.create(
            id_usuario=user,
            token_hash=token_hashed,
            fecha_expiracion=timezone.now() + timedelta(minutes=15),
            usado=False
        )
        
        enviar_email_reset(email, token)
        return True, "Si el correo está registrado, recibirás las instrucciones."
    except Usuario.DoesNotExist:
        return True, "Si el correo está registrado, recibirás las instrucciones."
    except Exception as e:
        import logging
        logger = logging.getLogger('reservas')
        logger.error("Error en solicitar_recuperacion_password para %s: %s", email, e)
        return False, "No se pudo enviar el correo. Intente más tarde."

def enviar_email_reset(email, token):
    subject = "Tu código de seguridad - LabSync"
    text_content = f"Tu código de recuperación es: {token}."
    html_content = f"""
    <div style="font-family: Arial, sans-serif; text-align: center; border: 1px solid #ddd; padding: 20px; border-radius: 10px;">
        <h2 style="color: #333;">Recuperación de Contraseña</h2>
        <p style="color: #666;">Utiliza el siguiente código para restablecer tu contraseña:</p>
        <div style="background-color: #f4f4f4; border-radius: 5px; padding: 15px; display: inline-block;">
            <span style="font-size: 32px; font-weight: bold; color: #4CAF50; letter-spacing: 8px;">{token}</span>
        </div>
        <p style="color: #888; font-size: 12px; margin-top: 20px;">Si no solicitaste este cambio, ignora el mensaje.</p>
    </div>
    """
    msg = EmailMultiAlternatives(subject, text_content, settings.EMAIL_HOST_USER, [email])
    msg.attach_alternative(html_content, "text/html")
    try:
        msg.send()
    except Exception as e:
        import logging
        logger = logging.getLogger('reservas')
        logger.error("Error al enviar email de recuperación a %s: %s", email, e)
        raise

def resetear_password(token, password):
    try:
        token_hashed = hashlib.sha256(token.strip().upper().encode('utf-8')).hexdigest()
        reset_entry = PasswordReset.objects.get(
            token_hash=token_hashed, 
            usado=False, 
            fecha_expiracion__gt=timezone.now()
        )
        
        user = reset_entry.id_usuario
        user.password_hash = make_password(password)
        user.save()
        
        reset_entry.usado = True
        reset_entry.save()
        
        # N-06: Invalidar todas las sesiones activas del usuario
        from ..models import SesionUsuario
        SesionUsuario.objects.filter(
            id_usuario=user,
            fecha_expiracion__gt=timezone.now()
        ).delete()
        
        return True, "¡Contraseña actualizada con éxito!"
    except PasswordReset.DoesNotExist:
        return False, "El código es incorrecto, expiró o ya fue utilizado."

def verificar_token(token):
    token_hashed = hashlib.sha256(token.strip().upper().encode('utf-8')).hexdigest()
    return PasswordReset.objects.filter(
        token_hash=token_hashed,
        usado=False,
        fecha_expiracion__gt=timezone.now()
    ).exists()


def purgar_sesiones_expiradas():
    """Elimina sesiones vencidas para evitar crecimiento indefinido de SesionUsuario."""
    from ..models import SesionUsuario
    import logging
    logger = logging.getLogger('reservas')
    ahora = timezone.now()
    deleted, _ = SesionUsuario.objects.filter(fecha_expiracion__lt=ahora).delete()
    if deleted:
        logger.info("Sesiones expiradas eliminadas: %d", deleted)
    return deleted

