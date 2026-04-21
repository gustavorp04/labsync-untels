import re
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.contrib.auth.hashers import check_password, make_password
from django.utils.crypto import get_random_string
from django.core.mail import EmailMultiAlternatives
from django.conf import settings
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from .models import Usuario
from django.db import connection

@api_view(['POST'])
def login(request):
    try:
        usuario = request.data.get('usuario')
        password = request.data.get('password')
        rol_seleccionado = request.data.get('rol')

        try:
            user = Usuario.objects.get(codigo_universitario=usuario)
        except Usuario.DoesNotExist:
            return Response({'error': 'Usuario no existe'}, status=400)

        if not check_password(password, user.password_hash):
            return Response({'error': 'Contraseña incorrecta'}, status=400)

        if user.rol != rol_seleccionado:
            return Response({'error': 'Rol incorrecto'}, status=403)

        return Response({
            'mensaje': 'Login exitoso',
            'user_id': user.id,
            'nombre': user.nombre,
            'rol': user.rol
        })
    except Exception:
        return Response({
            "error": "Error interno del servidor"
        }, status=500)

@api_view(['POST'])
def forgot_password(request):
    try:
        email = request.data.get("email")
        try:
            user = Usuario.objects.get(email=email)
        except Usuario.DoesNotExist:
            return Response({"error": "Email no existe"}, status=400)

        token = get_random_string(6).upper()
        user.reset_token = token
        user.save()
        send_reset_email(email, token)
        return Response({"mensaje": "Correo enviado"})
    except Exception:
        return Response({
            "error": "Error interno del servidor"
        }, status=500)

def send_reset_email(email, token):
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
    except Exception:
        pass

@api_view(['POST'])
def reset_password(request):
    try:
        token = request.data.get("token")
        password = request.data.get("password")

        if not token or not password:
            return Response({"error": "Datos incompletos."}, status=400)

        if not re.search(r"[A-Z]", password):
            return Response({"error": "La contraseña debe tener al menos una letra mayúscula."}, status=400)
        if not re.search(r"[0-9]", password):
            return Response({"error": "La contraseña debe tener al menos un número."}, status=400)
        if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", password):
            return Response({"error": "La contraseña debe tener al menos un símbolo especial."}, status=400)

        try:
            validate_password(password)
        except ValidationError as e:
            return Response({"error": list(e.messages)}, status=400)

        try:
            user = Usuario.objects.get(reset_token=token)
            user.password_hash = make_password(password)
            user.reset_token = None 
            user.save()
            return Response({"mensaje": "¡Contraseña actualizada con éxito!"})
        except Usuario.DoesNotExist:
            return Response({"error": "El código de verificación es incorrecto o ya fue utilizado."}, status=400)
    except Exception:
        return Response({
            "error": "Error interno del servidor"
        }, status=500)

@api_view(['POST'])
def verify_token(request):
    try:
        token = request.data.get("token")
        if not token:
            return Response({"error": "Se requiere el código"}, status=400)
        exists = Usuario.objects.filter(reset_token=token).exists()
        if exists:
            return Response({"mensaje": "Código válido"}, status=200)
        return Response({"error": "El código ingresado es incorrecto"}, status=400)
    except Exception:
        return Response({
            "error": "Error interno del servidor"
        }, status=500)

@api_view(['GET'])
def health_check(request):
    try:
        connection.cursor()
        return Response({
            "status": "ok",
            "database": "connected"
        }, status=200)
    except Exception:
        return Response({
            "status": "error",
            "database": "disconnected"
        }, status=500)