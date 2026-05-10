from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from django.utils import timezone
from ..models import CategoriaActivo, TipoActivo, ActivoLaboratorio, HistorialMantenimiento
from ..serializers.inventario_serializers import (
    CategoriaActivoSerializer, TipoActivoSerializer, 
    ActivoLaboratorioSerializer, HistorialMantenimientoSerializer
)

class CategoriaActivoViewSet(viewsets.ModelViewSet):
    queryset = CategoriaActivo.objects.all()
    serializer_serializer = CategoriaActivoSerializer

class TipoActivoViewSet(viewsets.ModelViewSet):
    queryset = TipoActivo.objects.all()
    serializer_class = TipoActivoSerializer

class ActivoLaboratorioViewSet(viewsets.ModelViewSet):
    queryset = ActivoLaboratorio.objects.all()
    serializer_class = ActivoLaboratorioSerializer

    def perform_update(self, serializer):
        # Capturar el estado anterior antes de guardar
        instance = self.get_object()
        estado_anterior = instance.estado
        new_instance = serializer.save()
        
        # Si el estado cambió, registrar en historial
        if estado_anterior != new_instance.estado:
            HistorialMantenimiento.objects.create(
                id_activo=new_instance,
                estado_anterior=estado_anterior,
                estado_nuevo=new_instance.estado,
                motivo=self.request.data.get('motivo', 'Cambio de estado manual'),
                fecha_cambio=timezone.now(),
                registrado_por=self.request.user if self.request.user.is_authenticated else None # Debería ser el usuario logueado
            )

class HistorialMantenimientoViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = HistorialMantenimiento.objects.all().order_by('-fecha_cambio')
    serializer_class = HistorialMantenimientoSerializer
