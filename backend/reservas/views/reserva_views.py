from rest_framework.decorators import api_view
from rest_framework.response import Response
from ..serializers.reserva_serializers import CrearReservaSerializer
from ..services import reserva_service
from ..models import Usuario

@api_view(['POST'])
def crear_reserva(request):
    """
    Endpoint para que el docente cree una reserva (PBI-03).
    """
    # 1. Validar request (El Serializer revisa reglas de negocio)
    serializer = CrearReservaSerializer(data=request.data)
    if not serializer.is_valid():
        # Devuelve el primer error que encuentre
        primer_error = list(serializer.errors.values())[0][0]
        return Response({'error': primer_error}, status=400)

    data = serializer.validated_data
    
    # IMPORTANTE: En producción usarías request.user. 
    # Como el frontend manda un user_id local temporalmente:
    user_id = request.data.get('user_id')
    if not user_id:
        return Response({'error': "Falta el id de usuario (user_id)."}, status=400)
    
    try:
        usuario = Usuario.objects.get(pk=user_id)
    except Usuario.DoesNotExist:
        return Response({'error': "Usuario no válido."}, status=401)

    # Solo docentes pueden reservar (opcional, pero buena práctica)
    if usuario.id_rol.nombre != 'docente':
        return Response({'error': "Solo los docentes pueden realizar reservas de laboratorios."}, status=403)

    # 2. Ejecutar Lógica de Negocio (El Service crea la reserva)
    reserva, error = reserva_service.crear_reserva_docente(
        usuario=usuario,
        horario=data['horario_obj'],
        cantidad_alumnos=data['cantidad_alumnos'],
        acepta_dj=data['acepto_declaracion_jurada']
    )

    # 3. Respuesta
    if error:
        return Response({'error': error}, status=409) # 409 Conflict

    return Response({
        'mensaje': 'Reserva creada con éxito.',
        'reserva_id': reserva.id_reserva
    }, status=201)
