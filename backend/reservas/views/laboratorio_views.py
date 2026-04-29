from rest_framework import generics
from ..models import Laboratorio, ActivoLaboratorio
from ..serializers.laboratorio_serializers import (
    LaboratorioListSerializer, 
    LaboratorioDetailSerializer, 
    ActivoLaboratorioSerializer
)

class LaboratorioListView(generics.ListAPIView):
    """Devuelve la lista general de todos los laboratorios"""
    queryset = Laboratorio.objects.all()
    serializer_class = LaboratorioListSerializer

class LaboratorioDetailView(generics.RetrieveAPIView):
    """Devuelve un laboratorio específico y la lista de todos sus equipos"""
    queryset = Laboratorio.objects.all()
    serializer_class = LaboratorioDetailSerializer
    lookup_field = 'id_laboratorio'

class ActivoLaboratorioUpdateView(generics.UpdateAPIView):
    """Permite al administrador cambiar el estado de un equipo a Mantenimiento/Operativo"""
    queryset = ActivoLaboratorio.objects.all()
    serializer_class = ActivoLaboratorioSerializer
    lookup_field = 'id_activo'
