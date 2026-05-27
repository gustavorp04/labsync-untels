from rest_framework import viewsets, status, permissions
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from reservas.models import Usuario, Laboratorio, Reserva, Incidencia, Asistencia, HorarioDisponible
from ..utils.auth import IsAdminOrJefatura, IsAdminOrJefaturaOrSelf, IsAdminOrJefaturaOrReadOnly

# Importaciones corregidas apuntando a tus archivos actuales
from ..serializers.auth_serializers import UsuarioSerializer
from ..serializers.laboratorio_serializers import LaboratorioListSerializer
from ..serializers.reserva_serializers import ReservaSerializer, AsistenciaSerializer, HorarioDisponibleSerializer
from ..serializers.incidencia_serializers import IncidenciaSerializer


class IsOwnerOrAdmin(permissions.BasePermission):
    """Permite acceso al dueño de la reserva o a admin/jefatura."""
    def has_object_permission(self, request, view, obj):
        if request.user.id_rol.nombre in ('admin_lab', 'jefatura'):
            return True
        return obj.id_usuario == request.user

class UsuarioViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAdminOrJefaturaOrSelf]
    serializer_class = UsuarioSerializer

    def get_queryset(self):
        # Solución a N+1 queries en usuarios
        return Usuario.objects.all().select_related(
            'id_rol', 'perfildocente', 'perfilestudiante', 'perfilestudiante__id_carrera'
        )

class LaboratorioViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAdminOrJefaturaOrReadOnly]
    serializer_class = LaboratorioListSerializer

    def get_queryset(self):
        # A-3: Reemplaza el queryset estático para incluir select_related y
        # la anotación que usa LaboratorioListSerializer.get_equipos_operativos
        from django.db.models import Count, Q
        return (
            Laboratorio.objects
            .select_related('id_tipo', 'id_facultad')
            .annotate(
                equipos_operativos_count=Count(
                    'activolaboratorio',
                    filter=Q(
                        activolaboratorio__id_tipo_activo__nombre__in=['CPU', 'Mesa'],
                        activolaboratorio__estado='Operativo',
                    )
                )
            )
        )

class ReservaViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = ReservaSerializer

    def get_queryset(self):
        # N-03: La purga se maneja vía scheduler (apps.py) cada 5 min.
        # Evitamos escrituras en operaciones de lectura.
        user = self.request.user
        base_qs = Reserva.objects.all().select_related(
            'id_usuario', 'id_usuario__id_rol',
            'id_horario', 'id_horario__id_laboratorio'
        ).prefetch_related(
            'reservadetalle_set__id_activo__id_tipo_activo',
            'historialreserva_set'
        ).order_by('-created_at')

        if user.id_rol.nombre in ('admin_lab', 'jefatura'):
            return base_qs
        return base_qs.filter(id_usuario=user)

    def get_permissions(self):
        if self.action in ('retrieve', 'update', 'partial_update', 'destroy'):
            return [IsAuthenticated(), IsOwnerOrAdmin()]
        return super().get_permissions()

    def destroy(self, request, *args, **kwargs):
        """
        DELETE bloqueado intencionalmente.

        Borrar una reserva directo en la BD saltea toda la lógica de negocio
        (historial, recalcular aforo, penalizaciones, etc.).
        Para cancelar una reserva usa el endpoint correcto:
          PATCH /api/v1/usuarios/{id_usuario}/reservas/{id_reserva}/cancelar/
        """
        return Response(
            {
                'error': 'No se permite eliminar reservas directamente.',
                'accion': 'Para cancelar una reserva usa: '
                          'PATCH /api/v1/usuarios/{id_usuario}/reservas/{id_reserva}/cancelar/',
            },
            status=status.HTTP_405_METHOD_NOT_ALLOWED,
        )

class IncidenciaViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = IncidenciaSerializer

    def get_queryset(self):
        user = self.request.user
        base_qs = Incidencia.objects.all().select_related(
            'id_detalle', 'id_detalle__id_reserva', 'id_activo', 'id_activo__id_tipo_activo'
        ).order_by('-fecha_reporte')
        
        if user.id_rol.nombre in ('admin_lab', 'jefatura'):
            return base_qs
        # Los usuarios normales solo ven las incidencias de sus reservas
        return base_qs.filter(id_detalle__id_reserva__id_usuario=user)

    def get_permissions(self):
        # Solo admin o jefatura pueden crear o modificar incidencias directamente mediante este ViewSet
        if self.action not in ('list', 'retrieve'):
            return [IsAdminOrJefatura()]
        return super().get_permissions()

class AsistenciaViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = AsistenciaSerializer

    def get_queryset(self):
        user = self.request.user
        base_qs = Asistencia.objects.all().select_related('id_reserva', 'id_reserva__id_usuario')
        if user.id_rol.nombre in ('admin_lab', 'jefatura'):
            return base_qs
        return base_qs.filter(id_reserva__id_usuario=user)

    def get_permissions(self):
        # Solo admin o jefatura pueden crear/modificar asistencias
        if self.action not in ('list', 'retrieve'):
            return [IsAdminOrJefatura()]
        return super().get_permissions()

class HorarioDisponibleViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAdminOrJefaturaOrReadOnly]
    serializer_class = HorarioDisponibleSerializer

    def get_queryset(self):
        # Optimizar N+1 queries con select_related
        queryset = HorarioDisponible.objects.all().select_related(
            'id_laboratorio', 'id_laboratorio__id_tipo'
        ).order_by('fecha', 'hora_inicio')
        
        id_lab = self.request.query_params.get('id_laboratorio')
        if id_lab:
            queryset = queryset.filter(id_laboratorio=id_lab)
        fecha = self.request.query_params.get('fecha')
        if fecha:
            queryset = queryset.filter(fecha=fecha)
        return queryset