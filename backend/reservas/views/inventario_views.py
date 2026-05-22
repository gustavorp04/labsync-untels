from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.decorators import api_view
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
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
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        data = serializer.data
        
        # Inyectar el campo estado_reserva e id_reserva en la respuesta JSON
        if request.query_params.get('id_horario'):
            estado_map = {a.id_activo: getattr(a, 'estado_reserva', None) for a in queryset}
            reserva_id_map = {a.id_activo: getattr(a, 'reserva_id', None) for a in queryset}
            for item in data:
                item['estado_reserva'] = estado_map.get(item['id_activo'], None)
                item['id_reserva'] = reserva_id_map.get(item['id_activo'], None)
                # Mantenemos 'reservado' por compatibilidad temporal
                item['reservado'] = bool(item['estado_reserva'])
        
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

        # Obtener usuario admin del request de forma segura (con fallback a lo que envíe el cliente)
        usuario_id = request.user.id_usuario if request.user and hasattr(request.user, 'id_usuario') else request.data.get('registrado_por')

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
