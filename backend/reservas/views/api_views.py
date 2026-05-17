from rest_framework import viewsets
from reservas.models import Usuario, Laboratorio, Reserva, Incidencia, Asistencia, HorarioDisponible

# Importaciones corregidas apuntando a tus archivos actuales
from ..serializers.auth_serializers import UsuarioSerializer
from ..serializers.laboratorio_serializers import LaboratorioListSerializer
from ..serializers.reserva_serializers import ReservaSerializer, AsistenciaSerializer, HorarioDisponibleSerializer
from ..serializers.incidencia_serializers import IncidenciaSerializer

class UsuarioViewSet(viewsets.ModelViewSet):
    queryset = Usuario.objects.all()
    serializer_class = UsuarioSerializer

class LaboratorioViewSet(viewsets.ModelViewSet):
    queryset = Laboratorio.objects.all()
    serializer_class = LaboratorioListSerializer

class ReservaViewSet(viewsets.ModelViewSet):
    serializer_class = ReservaSerializer

    def get_queryset(self):
        # Ejecutar la purga automática de reservas pendientes expiradas (5 min) para el quórum
        try:
            from ..services import reserva_service
            reserva_service.purgar_pendientes_vencidos()
        except Exception as e:
            print(f"WARN: Error en purgar_pendientes_vencidos en ReservaViewSet: {e}")
        
        return Reserva.objects.all().order_by('-created_at')

class IncidenciaViewSet(viewsets.ModelViewSet):
    queryset = Incidencia.objects.all().order_by('-fecha_reporte')
    serializer_class = IncidenciaSerializer

class AsistenciaViewSet(viewsets.ModelViewSet):
    queryset = Asistencia.objects.all()
    serializer_class = AsistenciaSerializer

class HorarioDisponibleViewSet(viewsets.ModelViewSet):
    serializer_class = HorarioDisponibleSerializer

    def get_queryset(self):
        queryset = HorarioDisponible.objects.all().order_by('fecha', 'hora_inicio')
        id_lab = self.request.query_params.get('id_laboratorio')
        if id_lab:
            queryset = queryset.filter(id_laboratorio=id_lab)
        fecha = self.request.query_params.get('fecha')
        if fecha:
            queryset = queryset.filter(fecha=fecha)
        return queryset