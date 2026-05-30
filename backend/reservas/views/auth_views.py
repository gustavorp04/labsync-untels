import logging
import secrets
from datetime import timedelta
from django.utils import timezone
from django.conf import settings as django_settings
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
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
        fecha_expiracion = timezone.now() + timedelta(hours=8)
        SesionUsuario.objects.create(
            id_usuario=user,
            token=token,
            fecha_expiracion=fecha_expiracion
        )

        logger.info(f"Login exitoso para usuario: {data['usuario']} con rol {expected_role}")

        # C-2: El token viaja en una cookie httpOnly — no se expone en el body.
        # SameSite=None+Secure en producción (cross-origin Vercel↔GCP);
        # SameSite=Lax en desarrollo (localhost, sin HTTPS).
        is_prod = not django_settings.DEBUG
        response = Response({
            'mensaje': 'Login exitoso',
            'token': token,
            **user_data          # nombre, id_usuario, rol, carrera, ciclo, etc.
        })
        response.set_cookie(
            key='auth_token',
            value=token,
            max_age=8 * 3600,
            httponly=True,
            secure=is_prod,
            samesite='None' if is_prod else 'Lax',
            path='/',
        )
        return response
    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        logger.error(f"Error en login para {request.data.get('usuario')}: {str(e)}\n{error_trace}")
        return Response({
            "error": f"Error interno: {str(e)}", 
            "trace": error_trace
        }, status=500)


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
def logout_view(request):
    """C-2: Invalida la sesión en BD y expira la cookie httpOnly.
    No requiere autenticación — permite limpiar incluso con token vencido."""
    # Leer el token directamente de la cookie para invalidar en BD
    token = request.COOKIES.get('auth_token')
    if token:
        try:
            SesionUsuario.objects.filter(token=token).delete()
            logger.info("Logout: sesión invalidada para token …%s", token[-6:])
        except Exception as exc:
            logger.warning("Logout: error al invalidar sesión: %s", exc)

    is_prod = not django_settings.DEBUG
    response = Response({'mensaje': 'Sesión cerrada correctamente.'})
    # Expirar la cookie enviando max_age=0 con los mismos flags con que se creó
    response.set_cookie(
        key='auth_token',
        value='',
        max_age=0,
        httponly=True,
        secure=is_prod,
        samesite='None' if is_prod else 'Lax',
        path='/',
    )
    return response


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
