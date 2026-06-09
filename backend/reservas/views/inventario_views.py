from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.decorators import api_view
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.core.cache import cache
from ..models import CategoriaActivo, TipoActivo, ActivoLaboratorio, HistorialMantenimiento, Usuario
from ..serializers.inventario_serializers import (
    CategoriaActivoSerializer, TipoActivoSerializer,
    ActivoLaboratorioSerializer, HistorialMantenimientoSerializer
)
from .. import services
from ..services import laboratorio_service
from ..utils.auth import IsAdminOrJefatura


class CategoriaActivoListView(generics.ListAPIView):
    """Lista todas las categorías de activos"""
    permission_classes = [IsAuthenticated]
    queryset = CategoriaActivo.objects.all()
    serializer_class = CategoriaActivoSerializer


class TipoActivoListView(generics.ListAPIView):
    """Lista todos los tipos de activos"""
    permission_classes = [IsAuthenticated]
    queryset = TipoActivo.objects.all()
    serializer_class = TipoActivoSerializer



class ActivosPorLaboratorioView(generics.ListAPIView):
    """
    Lista todos los activos de un laboratorio.
    Si se provee 'id_horario', marca cuáles están ocupados (reservados).
    """
    permission_classes = [IsAuthenticated]
    serializer_class = ActivoLaboratorioSerializer

    def get_queryset(self):
        id_lab = self.kwargs['id_laboratorio']
        id_horario = self.request.query_params.get('id_horario')
        
        queryset = ActivoLaboratorio.objects.filter(
            id_laboratorio=id_lab
        ).select_related('id_tipo_activo', 'id_laboratorio').order_by('id_tipo_activo__nombre', 'num_serie')
        
        # Si hay un horario, mapeamos el estado de reserva
        if id_horario:
            from ..models import ReservaDetalle
            detalles = ReservaDetalle.objects.filter(
                id_reserva__id_horario=id_horario,
                id_reserva__estado__in=['Programada', 'Pendiente']
            ).select_related('id_reserva')
            
            estado_map = {d.id_activo_id: d.id_reserva.estado for d in detalles}
            reserva_id_map = {d.id_activo_id: d.id_reserva_id for d in detalles}
            
            for activo in queryset:
                activo.estado_reserva = estado_map.get(activo.id_activo, None)
                activo.reserva_id = reserva_id_map.get(activo.id_activo, None)
        
        return queryset

    def list(self, request, *args, **kwargs):
        id_lab = self.kwargs['id_laboratorio']
        id_horario = request.query_params.get('id_horario')

        if id_horario:
            cache_key = f"activos_lab_{id_lab}_{id_horario}"
            cached = cache.get(cache_key)
            if cached is not None:
                return Response(cached)

        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        data = serializer.data

        # Inyectar el campo estado_reserva e id_reserva en la respuesta JSON
        if id_horario:
            estado_map = {a.id_activo: getattr(a, 'estado_reserva', None) for a in queryset}
            reserva_id_map = {a.id_activo: getattr(a, 'reserva_id', None) for a in queryset}
            for item in data:
                item['estado_reserva'] = estado_map.get(item['id_activo'], None)
                item['id_reserva'] = reserva_id_map.get(item['id_activo'], None)
                # Mantenemos 'reservado' por compatibilidad temporal
                item['reservado'] = bool(item['estado_reserva'])
            cache.set(cache_key, data, 20)

        return Response(data)


class ActivoUpdateView(generics.UpdateAPIView):
    """
    Permite al Admin cambiar el estado de un equipo (Operativo / Mantenimiento / Dado de baja).
    Registra automáticamente en HISTORIAL_MANTENIMIENTO y recalcula habilitación del lab.
    """
    permission_classes = [IsAdminOrJefatura]
    queryset = ActivoLaboratorio.objects.all()
    serializer_class = ActivoLaboratorioSerializer
    lookup_field = 'id_activo'

    def update(self, request, *args, **kwargs):
        id_laboratorio = kwargs.get('id_laboratorio')
        id_activo = kwargs.get('id_activo')

        # Validar que el activo pertenezca al laboratorio indicado
        try:
            activo_check = ActivoLaboratorio.objects.get(pk=id_activo, id_laboratorio=id_laboratorio)
        except ActivoLaboratorio.DoesNotExist:
            return Response(
                {"error": "El activo especificado no pertenece al laboratorio indicado."},
                status=status.HTTP_400_BAD_REQUEST
            )

        nuevo_estado = request.data.get('estado')
        motivo = request.data.get('motivo', 'Cambio de estado manual')

        estados_validos = ['Operativo', 'Mantenimiento', 'Dado de baja']
        if nuevo_estado not in estados_validos:
            return Response(
                {"error": f"Estado inválido. Valores permitidos: {estados_validos}"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Validar usuario del request
        if not request.user or not hasattr(request.user, 'id_usuario'):
            return Response({"error": "Usuario no autenticado correctamente."}, status=status.HTTP_401_UNAUTHORIZED)
        usuario_id = request.user.id_usuario

        activo, laboratorio, mensajes, error = laboratorio_service.actualizar_estado_activo(
            id_activo, nuevo_estado, motivo, usuario_id
        )

        if error:
            return Response({"error": error}, status=status.HTTP_400_BAD_REQUEST)

        return Response({
            "ok": True,
            "mensaje": f"Equipo {activo.num_serie} → {activo.estado}",
            "laboratorio_id": laboratorio.id_laboratorio,
            "laboratorio_nombre": laboratorio.nombre,
            "laboratorio_habilitado": laboratorio.habilitado,
            "reasignaciones": mensajes,
        }, status=status.HTTP_200_OK)


class HistorialPorActivoView(generics.ListAPIView):
    """Lista el historial de cambios de un activo específico"""
    permission_classes = [IsAdminOrJefatura]
    serializer_class = HistorialMantenimientoSerializer

    def get_queryset(self):
        id_laboratorio = self.kwargs['id_laboratorio']
        id_activo = self.kwargs['id_activo']
        
        # Validar que el activo pertenezca al laboratorio indicado
        if not ActivoLaboratorio.objects.filter(pk=id_activo, id_laboratorio=id_laboratorio).exists():
            return HistorialMantenimiento.objects.none()
            
        return HistorialMantenimiento.objects.filter(
            id_activo=id_activo
        ).order_by('-fecha_cambio')


class HistorialPorLaboratorioView(generics.ListAPIView):
    """Lista todo el historial de mantenimiento de un laboratorio"""
    permission_classes = [IsAdminOrJefatura]
    serializer_class = HistorialMantenimientoSerializer


    def get_queryset(self):
        id_lab = self.kwargs['id_laboratorio']
        return HistorialMantenimiento.objects.filter(
            id_activo__id_laboratorio=id_lab
        ).select_related('id_activo', 'registrado_por').order_by('-fecha_cambio')


# =============================================================================
# PBI-12 — Endpoint para inhabilitar laboratorio manualmente
# =============================================================================

from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from ..services.laboratorio_service import inhabilitar_laboratorio

@api_view(['POST'])
@permission_classes([IsAdminOrJefatura])
def inhabilitar_laboratorio_view(request, id_laboratorio):
    """
    PBI-12: Inhabilita un laboratorio, cancela reservas futuras y notifica afectados.
    Body: { "motivo": "Descripción del motivo" }
    """
    motivo = request.data.get('motivo', 'Inhabilitación manual por administrador.')
    if not motivo.strip():
        return Response({'error': 'Debe indicar el motivo de inhabilitación.'}, status=status.HTTP_400_BAD_REQUEST)

    laboratorio, notificados, error = inhabilitar_laboratorio(
        id_laboratorio=id_laboratorio,
        motivo=motivo,
        usuario_id=request.data.get('usuario_id')
    )

    if error:
        return Response({'error': error}, status=status.HTTP_400_BAD_REQUEST)

    return Response({
        'mensaje': f'Laboratorio "{laboratorio.nombre}" inhabilitado correctamente.',
        'reservas_canceladas': len(notificados),
        'usuarios_notificados': notificados
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAdminOrJefatura])
def registrar_incidencia_view(request, id_laboratorio, id_activo):
    """
    PBI-22: Registra una incidencia para una PC y un laboratorio.
    """
    descripcion_dano = request.data.get('descripcion_dano')
    estado_activo_post = request.data.get('estado_activo_post', 'Mantenimiento')

    if not descripcion_dano or len(descripcion_dano.strip()) < 10:
        return Response(
            {"error": "La descripción del daño es obligatoria y debe tener al menos 10 caracteres."},
            status=status.HTTP_400_BAD_REQUEST
        )

    if estado_activo_post not in ['Mantenimiento', 'Dado de baja']:
        return Response(
            {"error": "El estado resultante debe ser 'Mantenimiento' o 'Dado de baja'."},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Validar que el activo pertenezca al laboratorio indicado
    try:
        activo = ActivoLaboratorio.objects.get(pk=id_activo, id_laboratorio=id_laboratorio)
    except ActivoLaboratorio.DoesNotExist:
        return Response(
            {"error": "El activo especificado no pertenece al laboratorio indicado."},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Validar usuario del request
    if not request.user or not hasattr(request.user, 'id_usuario'):
        return Response({"error": "Usuario no autenticado correctamente."}, status=status.HTTP_401_UNAUTHORIZED)
    usuario_id = request.user.id_usuario

    # Llamar al servicio
    incidencia, usuario_responsable, error = laboratorio_service.registrar_incidencia(
        id_activo=id_activo,
        descripcion_dano=descripcion_dano,
        estado_activo_post=estado_activo_post,
        registrado_por=usuario_id
    )

    if error:
        return Response({"error": error}, status=status.HTTP_400_BAD_REQUEST)

    # Retornar respuesta exitosa
    from ..serializers.incidencia_serializers import IncidenciaSerializer
    return Response({
        "ok": True,
        "mensaje": f"Incidencia registrada para el equipo {activo.num_serie}.",
        "incidencia": IncidenciaSerializer(incidencia).data,
        "usuario_responsable": usuario_responsable.nombre if usuario_responsable else None,
    }, status=status.HTTP_201_CREATED)