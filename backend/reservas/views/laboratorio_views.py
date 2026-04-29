from rest_framework import generics
from reservas.models import Laboratorio, ActivoLaboratorio
from reservas.serializers.laboratorio_serializers import (
    LaboratorioListSerializer, 
    LaboratorioDetailSerializer, 
    ActivoLaboratorioSerializer
)

class LaboratorioListView(generics.ListAPIView):
    """Devuelve la lista general de laboratorios (para el Dashboard)"""
    queryset = Laboratorio.objects.all()
    serializer_class = LaboratorioListSerializer

class LaboratorioDetailView(generics.RetrieveAPIView):
    """Devuelve el detalle de un lab y sus PCs"""
    queryset = Laboratorio.objects.all()
    serializer_class = LaboratorioDetailSerializer
    lookup_field = 'id_laboratorio'

class ActivoLaboratorioUpdateView(generics.UpdateAPIView):
    """Permite cambiar el estado de una PC (Operativo/Mantenimiento)"""
    queryset = ActivoLaboratorio.objects.all()
    serializer_class = ActivoLaboratorioSerializer
    lookup_field = 'id_activo'