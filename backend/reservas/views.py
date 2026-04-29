import re
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import generics
from django.contrib.auth.hashers import check_password, make_password
from django.utils.crypto import get_random_string
from django.core.mail import EmailMultiAlternatives
from django.conf import settings
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.utils import timezone
from datetime import timedelta
from django.db import connection

from .models import Usuario, Rol, PasswordReset, Laboratorio, ActivoLaboratorio
from .serializers import (
    LaboratorioListSerializer, 
    LaboratorioDetailSerializer, 
    ActivoLaboratorioSerializer
)


# =============================================================================
# ENDPOINTS SPRINT 1 & 2: AUTENTICACIÓN Y RECUPERACIÓN DE CONTRASEÑA
# =============================================================================

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

        if user.id_rol.nombre != rol_seleccionado:
            return Response({'error': 'Rol incorrecto'}, status=403)

        return Response({
            'mensaje': 'Login exitoso',
            'user_id': user.id_usuario,
            'nombre': user.nombre,
            'rol': user.id_rol.nombre
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
        
        # Guardar en la nueva tabla PasswordReset
        PasswordReset.objects.filter(id_usuario=user).delete() # Limpiar antiguos
        PasswordReset.objects.create(
            id_usuario=user,
            token_hash=token,
            fecha_expiracion=timezone.now() + timedelta(minutes=15)
        )
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
            # Buscar el token en la nueva tabla
            reset_entry = PasswordReset.objects.get(
                token_hash=token, 
                usado=False, 
                fecha_expiracion__gt=timezone.now()
            )
            
            user = reset_entry.id_usuario
            user.password_hash = make_password(password)
            user.save()
            
            # Marcar el token como usado
            reset_entry.usado = True
            reset_entry.save()
            
            return Response({"mensaje": "¡Contraseña actualizada con éxito!"})
        except PasswordReset.DoesNotExist:
            return Response({"error": "El código es incorrecto, expiró o ya fue utilizado."}, status=400)
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
        exists = PasswordReset.objects.filter(
            token_hash=token, 
            usado=False, 
            fecha_expiracion__gt=timezone.now()
        ).exists()
        
        if exists:
            return Response({"mensaje": "Código válido"}, status=200)
        return Response({"error": "El código es incorrecto o ha expirado"}, status=400)
    except Exception:
        return Response({
            "error": "Error interno del servidor"
        }, status=500)

@api_view(['GET'])
def health_check(request):
    """
    Verifica que el servicio esté activo y que la base de datos sea accesible de verdad.
    """
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
        
        return Response({
            "status": "ok",
            "database": "connected",
            "message": "Servicio operativo y autenticado"
        }, status=200)
    except Exception as e:
        print(f"FALLO DE HEALTH CHECK: {str(e)}")
        return Response({
            "status": "error",
            "database": "disconnected",
            "detail": "Error de conexión o autenticación con PostgreSQL"
        }, status=500)


# =============================================================================
# ENDPOINTS PBI-02: GESTIÓN DE LABORATORIOS E INVENTARIO
# =============================================================================

class LaboratorioListView(generics.ListAPIView):
    """Devuelve la lista general de todos los laboratorios"""
    queryset = Laboratorio.objects.all()
    serializer_class = LaboratorioListSerializer

class LaboratorioDetailView(generics.RetrieveAPIView):
    """Devuelve un laboratorio específico y la lista de todos sus equipos"""
    queryset = Laboratorio.objects.all()
    serializer_class = LaboratorioDetailSerializer
    lookup_field = 'id_laboratorio'

class ActivoLaboratorioUpdateView(generics.UpdateAPIView):
    """Permite al administrador cambiar el estado de un equipo a Mantenimiento/Operativo"""
    queryset = ActivoLaboratorio.objects.all()
    serializer_class = ActivoLaboratorioSerializer
    lookup_field = 'id_activo'