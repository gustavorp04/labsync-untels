import logging
import secrets
from datetime import timedelta
from django.utils import timezone
from rest_framework.decorators import api_view
from rest_framework.response import Response
from ..services import auth_service
from ..serializers.auth_serializers import LoginSerializer, ResetPasswordSerializer, UserSerializer
from ..models import SesionUsuario, PerfilEstudiante

logger = logging.getLogger('reservas')

def _base_login(request, expected_role):
    try:
        # We manually inject the role to use the same serializer
        data_with_role = request.data.copy()
        data_with_role['rol'] = expected_role
        
        serializer = LoginSerializer(data=data_with_role)
        if not serializer.is_valid():
            return Response({'error': 'Faltan datos obligatorios'}, status=400)

        data = serializer.validated_data
        user, error = auth_service.autenticar_usuario(data['usuario'], data['password'], expected_role)
        
        if error:
            status_code = 403 if error == "Rol incorrecto" else 400
            return Response({'error': error}, status=status_code)

        user_data = UserSerializer(user).data
        
        # PBI-04: Datos de carrera dinámicos para Estudiantes
        if expected_role == 'estudiante':
            # Búsqueda ultra-robusta del perfil
            try:
                perfil = PerfilEstudiante.objects.get(id_usuario=user)
            except PerfilEstudiante.DoesNotExist:
                perfil = None
            except Exception as e:
                import logging
                logger = logging.getLogger('reservas')
                logger.warning("Error al obtener PerfilEstudiante para usuario %s: %s", user.id_usuario, e)
                perfil = None

            if perfil:
                # Obtenemos el nombre de la carrera directamente de la BD
                user_data['carrera'] = perfil.id_carrera.nombre if perfil.id_carrera else 'Desconocida'
                user_data['ciclo'] = perfil.ciclo
            else:
                user_data['carrera'] = 'Desconocida'
                user_data['ciclo'] = 0

        # Crear sesión y token de acceso
        token = secrets.token_hex(32)
        fecha_expiracion = timezone.now() + timedelta(hours=24)
        SesionUsuario.objects.create(
            id_usuario=user,
            token=token,
            fecha_expiracion=fecha_expiracion
        )

        logger.info(f"Login exitoso para usuario: {data['usuario']} con rol {expected_role}")
        return Response({
            'mensaje': 'Login exitoso',
            'token': token,
            **user_data
        })
    except Exception as e:
        logger.error(f"Error en login para {request.data.get('usuario')}: {str(e)}")
        return Response({"error": "Error interno del servidor"}, status=500)


@api_view(['POST'])
def login_estudiante(request):
    return _base_login(request, 'estudiante')

@api_view(['POST'])
def login_docente(request):
    return _base_login(request, 'docente')

@api_view(['POST'])
def login_admin(request):
    return _base_login(request, 'admin_lab')

@api_view(['POST'])
def login_jefatura(request):
    return _base_login(request, 'jefatura')

@api_view(['POST'])
def forgot_password(request):
    try:
        email = request.data.get("email")
        success, message = auth_service.solicitar_recuperacion_password(email)
        
        if not success:
            return Response({"error": message}, status=400)
        
        return Response({"mensaje": message})
    except Exception:
        return Response({"error": "Error interno del servidor"}, status=500)

@api_view(['POST'])
def reset_password(request):
    try:
        serializer = ResetPasswordSerializer(data=request.data)
        if not serializer.is_valid():
            # Obtiene el primer mensaje de error del serializador
            error_message = list(serializer.errors.values())[0][0]
            return Response({"error": error_message}, status=400)

        data = serializer.validated_data
        success, message = auth_service.resetear_password(data['token'], data['password'])
        
        if not success:
            return Response({"error": message}, status=400)
            
        return Response({"mensaje": message})
    except Exception:
        return Response({"error": "Error interno del servidor"}, status=500)

@api_view(['POST'])
def verify_token(request):
    try:
        token = request.data.get("token")
        if not token:
            return Response({"error": "Se requiere el código"}, status=400)
        
        if auth_service.verificar_token(token):
            return Response({"mensaje": "Código válido"}, status=200)
        
        return Response({"error": "El código es incorrecto o ha expirado"}, status=400)
    except Exception:
        return Response({"error": "Error interno del servidor"}, status=500)
