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

from rest_framework.response import Response
from reservas.services import laboratorio_service

class ActivoLaboratorioUpdateView(generics.UpdateAPIView):
    """Permite cambiar el estado de una PC (Operativo/Mantenimiento)"""
    queryset = ActivoLaboratorio.objects.all()
    serializer_class = ActivoLaboratorioSerializer
    lookup_field = 'id_activo'

    def update(self, request, *args, **kwargs):
        # Obtenemos el ID de la URL y el nuevo estado del body JSON
        id_activo = kwargs.get('id_activo')
        nuevo_estado = request.data.get('estado')

        if not nuevo_estado:
            return Response({"error": "El campo 'estado' es requerido."}, status=400)

        # Usamos el servicio del PBI-02 (El "Chef")
        activo, laboratorio, mensajes, error = laboratorio_service.actualizar_estado_activo(id_activo, nuevo_estado)

        if error:
            return Response({"error": error}, status=400)

        # Devolvemos el estado de la PC y un aviso si el lab se inhabilitó
        return Response({
            "mensaje": f"Equipo {activo.num_serie} actualizado a {activo.estado}",
            "laboratorio_id": laboratorio.id_laboratorio,
            "laboratorio_habilitado": laboratorio.habilitado,
            "reasignaciones": mensajes
        })