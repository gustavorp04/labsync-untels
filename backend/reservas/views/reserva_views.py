from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone
from django.db import transaction
from datetime import timedelta
from ..serializers.reserva_serializers import CrearReservaSerializer, HorarioDisponibleSerializer
from ..services import reserva_service
from ..models import Usuario, Penalizacion, HorarioDisponible, Laboratorio, ActivoLaboratorio, Reserva, ReservaDetalle, HistorialReserva


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def horarios_por_laboratorio(request, id_laboratorio):
    """Devuelve los horarios de un laboratorio específico.
    Si se proporciona el parámetro 'fecha' en la consulta, se filtrará exactamente por esa fecha
    (mostrando todos los horarios, útil para la vista del administrador).
    De lo contrario, se devuelven los horarios futuros que estén 'Disponible' (para reserva).
    """
    fecha = request.query_params.get('fecha')
    if fecha:
        horarios = HorarioDisponible.objects.filter(
            id_laboratorio=id_laboratorio,
            fecha=fecha
        ).order_by('hora_inicio')
    else:
        hoy = timezone.localtime(timezone.now()).date()
        horarios = HorarioDisponible.objects.filter(
            id_laboratorio=id_laboratorio,
            fecha__gte=hoy,
            estado='Disponible'
        ).order_by('fecha', 'hora_inicio')
    
    serializer = HorarioDisponibleSerializer(horarios, many=True)
    return Response(serializer.data)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def mis_reservas(request, id_usuario):
    """
    GET: Devuelve las reservas del usuario indicado por id_usuario en la ruta anidada.
    POST: Crea una reserva para el usuario indicado por id_usuario en la ruta anidada
          (estudiante o docente según el rol del usuario).
    """
    # Validar permisos: el usuario autenticado debe coincidir con el id_usuario de la ruta (o ser admin/jefatura)
    if str(request.user.id_usuario) != str(id_usuario) and request.user.id_rol.nombre not in ('admin_lab', 'jefatura'):
        return Response({'error': 'No tienes permiso para acceder a las reservas de este usuario.'}, status=403)

    try:
        usuario = Usuario.objects.get(pk=id_usuario)
    except Usuario.DoesNotExist:
        return Response({'error': "Usuario no encontrado."}, status=404)

    if request.method == 'GET':
        try:
            reserva_service.purgar_pendientes_vencidos()
        except Exception as e:
            print(f"WARN: Error en purgar_pendientes_vencidos en mis_reservas: {e}")

        from ..serializers.reserva_serializers import ReservaSerializer
        reservas = Reserva.objects.filter(id_usuario=id_usuario).order_by('-created_at')
        serializer = ReservaSerializer(reservas, many=True)
        return Response(serializer.data)

    elif request.method == 'POST':
        rol = usuario.id_rol.nombre
        if rol == 'docente':
            serializer = CrearReservaSerializer(data=request.data)
            if not serializer.is_valid():
                primer_error = list(serializer.errors.values())[0][0]
                return Response({'error': str(primer_error)}, status=400)

            data = serializer.validated_data
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

        elif rol == 'estudiante':
            try:
                reserva_service.purgar_pendientes_vencidos()
            except Exception as e:
                print(f"WARN: Error en purgar_pendientes_vencidos en crear_reserva_estudiante: {e}")

            id_horario = request.data.get('id_horario')
            id_activo = request.data.get('id_activo')
            acepta_dj = request.data.get('acepto_declaracion_jurada', False)

            if not all([id_horario, id_activo]):
                return Response({'error': "Faltan campos: id_horario, id_activo."}, status=400)

            if not acepta_dj:
                return Response({'error': "Debe aceptar la declaración jurada para reservar."}, status=400)

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
        else:
            return Response({'error': f"El rol '{rol}' no está autorizado para crear reservas."}, status=403)


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def cancelar_reserva(request, id_usuario, id_reserva):
    """Cancela una reserva existente a través de la ruta anidada del usuario."""
    # Validar permisos: el usuario autenticado debe coincidir con el id_usuario de la ruta (o ser admin/jefatura)
    if str(request.user.id_usuario) != str(id_usuario) and request.user.id_rol.nombre not in ('admin_lab', 'jefatura'):
        return Response({'error': 'No tienes permiso para cancelar esta reserva.'}, status=403)

    try:
        reserva = Reserva.objects.get(pk=id_reserva)
    except Reserva.DoesNotExist:
        return Response({'error': "Reserva no encontrada."}, status=404)

    # Validar que la reserva en efecto pertenezca al usuario del path
    if str(reserva.id_usuario_id) != str(id_usuario):
        return Response({'error': "La reserva especificada no pertenece al usuario indicado."}, status=400)

    if reserva.estado not in ('Programada', 'Pendiente'):
        return Response({'error': f"Solo puedes cancelar reservas en estado Programada o Pendiente. Estado actual: {reserva.estado}"}, status=400)

    try:
        with transaction.atomic():
            estado_anterior = reserva.estado
            reserva.estado = 'Cancelada'
            reserva.updated_at = timezone.now()  # Forzar actualización de timestamp
            reserva.save()
            
            # Liberar el horario de forma segura
            horario = reserva.id_horario
            if horario:
                cap_actual = horario.capacidad_ocupada or 0
                cant_reserva = reserva.cantidad_alumnos or 1
                
                horario.capacidad_ocupada = max(0, cap_actual - cant_reserva)
                if horario.estado == 'Completo':
                    horario.estado = 'Disponible'
                horario.save()

            # Log de la cancelación usando ID directo
            try:
                HistorialReserva.objects.create(
                    reserva=reserva,
                    estado_anterior=estado_anterior,
                    estado_nuevo='Cancelada',
                    usuario_cambio_id=reserva.id_usuario_id,
                    observacion="Reserva cancelada por el usuario."
                )
            except Exception as log_err:
                print(f"WARN: No se pudo crear el historial de reserva: {log_err}")

        return Response({'mensaje': 'Reserva cancelada correctamente.'})
    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        print(f"ERROR al cancelar reserva {id_reserva}: {str(e)}\n{error_trace}")
        return Response({
            'error': "Error interno al procesar la cancelación.",
            'detalle': str(e)
        }, status=500)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def marcar_asistencia(request, id_reserva):
    """PBI-06: Administrador marca asistencia o No-Show."""
    asistio = request.data.get('asistio', False)
    ok, error = reserva_service.marcar_asistencia(id_reserva, asistio)
    
    if not ok:
        return Response({'error': error}, status=400)
        
    estado = 'Completada' if asistio else 'No-show'
    return Response({'mensaje': f'Reserva marcada como {estado}.'})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_historial_reservas(request):
    """Devuelve el historial global de cambios de estado de todas las reservas."""
    from ..models import HistorialReserva
    from ..serializers.reserva_serializers import HistorialReservaSerializer
    
    historial = HistorialReserva.objects.all().order_by('-fecha_cambio')[:100]
    serializer = HistorialReservaSerializer(historial, many=True)
    return Response(serializer.data)
