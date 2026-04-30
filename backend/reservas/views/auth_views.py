import logging
from rest_framework.decorators import api_view
from rest_framework.response import Response
from ..services import auth_service
from ..serializers.auth_serializers import LoginSerializer, ResetPasswordSerializer, UserSerializer

logger = logging.getLogger('reservas')

@api_view(['POST'])
def login(request):
    try:
        serializer = LoginSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({'error': 'Faltan datos obligatorios'}, status=400)

        data = serializer.validated_data
        user, error = auth_service.autenticar_usuario(data['usuario'], data['password'], data['rol'])
        
        if error:
            status_code = 403 if error == "Rol incorrecto" else 400
            return Response({'error': error}, status=status_code)

        user_data = UserSerializer(user).data
        logger.info(f"Login exitoso para usuario: {data['usuario']}")
        return Response({
            'mensaje': 'Login exitoso',
            **user_data
        })
    except Exception as e:
        logger.error(f"Error en login para {request.data.get('usuario')}: {str(e)}")
        return Response({"error": "Error interno del servidor"}, status=500)

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
