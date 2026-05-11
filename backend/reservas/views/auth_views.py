import logging
from rest_framework.decorators import api_view
from rest_framework.response import Response
from ..services import auth_service
from ..serializers.auth_serializers import LoginSerializer, ResetPasswordSerializer, UserSerializer

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
        
        # PBI-04: Forzado de datos de carrera para Estudiantes
        if expected_role == 'estudiante':
            print("!!! DIAGNOSTICO: PROCESANDO LOGIN DE ESTUDIANTE !!!")
            from ..models import PerfilEstudiante
            # Búsqueda ultra-robusta del perfil
            try:
                perfil = PerfilEstudiante.objects.get(id_usuario=user)
            except:
                perfil = PerfilEstudiante.objects.filter(id_usuario_id=user.id_usuario).first()

            if perfil:
                # Obtenemos el ID de carrera de forma segura
                id_carrera = perfil.id_carrera.id_carrera if hasattr(perfil.id_carrera, 'id_carrera') else perfil.id_carrera_id
                
                if id_carrera == 1:
                    user_data['carrera'] = 'Sistemas'
                elif id_carrera == 3:
                    user_data['carrera'] = 'Electronica'
                else:
                    user_data['carrera'] = 'Ambiental'
                
                user_data['ciclo'] = perfil.ciclo
            else:
                # Si llegamos aquí, el usuario no tiene perfil en la BD
                user_data['carrera'] = 'Desconocida'
                user_data['ciclo'] = 0

        logger.info(f"Login exitoso para usuario: {data['usuario']} con rol {expected_role}")
        return Response({
            'mensaje': 'Login exitoso',
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
