from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone
from django.db import transaction
from datetime import timedelta
from ..serializers.reserva_serializers import CrearReservaSerializer, HorarioDisponibleSerializer
from ..services import reserva_service
from ..models import Usuario, Penalizacion, HorarioDisponible, Laboratorio, ActivoLaboratorio, Reserva, ReservaDetalle, HistorialReserva


@api_view(['POST'])
def crear_reserva(request):
    """Endpoint PBI-03: Docente crea una reserva de laboratorio completo."""
    serializer = CrearReservaSerializer(data=request.data)
    if not serializer.is_valid():
        primer_error = list(serializer.errors.values())[0][0]
        return Response({'error': str(primer_error)}, status=400)

    data = serializer.validated_data
    user_id = request.data.get('user_id')
    if not user_id:
        return Response({'error': "Falta el id de usuario (user_id)."}, status=400)

    try:
        usuario = Usuario.objects.get(pk=user_id)
    except Usuario.DoesNotExist:
        return Response({'error': "Usuario no válido."}, status=401)

    if usuario.id_rol.nombre != 'docente':
        return Response({'error': "Solo los docentes pueden realizar reservas de laboratorios."}, status=403)

    reserva, error = reserva_service.crear_reserva_docente(
        usuario=usuario,
        horario=data['horario_obj'],
        cantidad_alumnos=data['cantidad_alumnos'],
        acepta_dj=data['acepto_declaracion_jurada'],
        activos_ids=request.data.get('activos_ids', [])
    )

    if error:
        return Response({'error': error}, status=409)

    return Response({
        'mensaje': 'Reserva creada con éxito.',
        'reserva_id': reserva.id_reserva
    }, status=201)


@api_view(['POST'])
def crear_reserva_estudiante(request):
    """Endpoint PBI-04: Estudiante reserva una máquina específica."""
    user_id = request.data.get('user_id')
    id_horario = request.data.get('id_horario')
    id_activo = request.data.get('id_activo')
    acepta_dj = request.data.get('acepto_declaracion_jurada', False)

    if not all([user_id, id_horario, id_activo]):
        return Response({'error': "Faltan campos: user_id, id_horario, id_activo."}, status=400)

    if not acepta_dj:
        return Response({'error': "Debe aceptar la declaración jurada para reservar."}, status=400)

    try:
        usuario = Usuario.objects.get(pk=user_id)
    except Usuario.DoesNotExist:
        return Response({'error': "Usuario no válido."}, status=401)

    # Verificar penalización activa
    ahora = timezone.now()
    penalizacion_activa = Penalizacion.objects.filter(
        id_usuario=usuario,
        fecha_fin__gt=ahora
    ).first()
    if penalizacion_activa:
        return Response({
            'error': f"Tienes una penalización activa hasta {penalizacion_activa.fecha_fin.strftime('%d/%m/%Y')}. No puedes realizar reservas."
        }, status=403)

    try:
        reserva, error = reserva_service.crear_reserva_estudiante(
            usuario=usuario,
            id_horario=id_horario,
            id_activo=id_activo,
            acepta_dj=acepta_dj
        )
    except Exception as e:
        import traceback
        traceback.print_exc()
        return Response({'error': f"Error interno: {str(e)}"}, status=500)

    if error:
        return Response({'error': error}, status=409)

    return Response({
        'mensaje': 'Reserva de equipo creada con éxito.',
        'reserva_id': reserva.id_reserva
    }, status=201)


@api_view(['GET'])
def horarios_por_laboratorio(request, id_laboratorio):
    """Devuelve los horarios disponibles de un laboratorio específico."""
    manana = timezone.now().date()
    horarios = HorarioDisponible.objects.filter(
        id_laboratorio=id_laboratorio,
        fecha__gte=manana,
        estado='Disponible'
    ).order_by('fecha', 'hora_inicio')
    serializer = HorarioDisponibleSerializer(horarios, many=True)
    return Response(serializer.data)


@api_view(['GET'])
def mis_reservas(request):
    """Devuelve las reservas del usuario indicado por user_id."""
    user_id = request.query_params.get('user_id')
    if not user_id:
        return Response({'error': "Falta user_id."}, status=400)

    from ..serializers.reserva_serializers import ReservaSerializer
    reservas = Reserva.objects.filter(id_usuario=user_id).order_by('-created_at')
    serializer = ReservaSerializer(reservas, many=True)
    return Response(serializer.data)


@api_view(['PATCH'])
def cancelar_reserva(request, id_reserva):
    """Cancela una reserva existente."""
    user_id = request.data.get('user_id')
    try:
        reserva = Reserva.objects.get(pk=id_reserva)
    except Reserva.DoesNotExist:
        return Response({'error': "Reserva no encontrada."}, status=404)

    if str(reserva.id_usuario.id_usuario) != str(user_id):
        return Response({'error': "No tienes permiso para cancelar esta reserva."}, status=403)

    if reserva.estado not in ('Programada', 'Pendiente'):
        return Response({'error': "Solo puedes cancelar reservas en estado Programada o Pendiente."}, status=400)

    with transaction.atomic():
        reserva.estado = 'Cancelada'
        reserva.save()
        # Liberar el horario
        horario = reserva.id_horario
        horario.capacidad_ocupada = max(0, horario.capacidad_ocupada - reserva.cantidad_alumnos)
        if horario.estado == 'Completo':
            horario.estado = 'Disponible'
        horario.save()

        # PBI-05: Log de la cancelación
        HistorialReserva.objects.create(
            reserva=reserva,
            estado_anterior='Programada' if reserva.estado == 'Cancelada' else 'Pendiente', # Simplificado
            estado_nuevo='Cancelada',
            usuario_cambio=reserva.id_usuario,
            observacion="Reserva cancelada por el usuario."
        )

    return Response({'mensaje': 'Reserva cancelada correctamente.'})


@api_view(['POST'])
def marcar_asistencia(request, id_reserva):
    """PBI-06: Administrador marca asistencia o No-Show."""
    asistio = request.data.get('asistio', False)
    ok, error = reserva_service.marcar_asistencia(id_reserva, asistio)
    
    if not ok:
        return Response({'error': error}, status=400)
        
    estado = 'Completada' if asistio else 'No-Show'
    return Response({'mensaje': f'Reserva marcada como {estado}.'})

