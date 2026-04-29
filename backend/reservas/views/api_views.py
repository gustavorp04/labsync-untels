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
    queryset = Reserva.objects.all().order_by('-created_at')
    serializer_class = ReservaSerializer

class IncidenciaViewSet(viewsets.ModelViewSet):
    queryset = Incidencia.objects.all().order_by('-fecha_reporte')
    serializer_class = IncidenciaSerializer

class AsistenciaViewSet(viewsets.ModelViewSet):
    queryset = Asistencia.objects.all()
    serializer_class = AsistenciaSerializer

class HorarioDisponibleViewSet(viewsets.ModelViewSet):
    queryset = HorarioDisponible.objects.filter(estado='Disponible').order_by('fecha', 'hora_inicio')
    serializer_class = HorarioDisponibleSerializer