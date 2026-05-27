from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from reservas.models import Laboratorio, ActivoLaboratorio
from reservas.serializers.laboratorio_serializers import (
    LaboratorioListSerializer, 
    LaboratorioDetailSerializer, 
    ActivoLaboratorioSerializer
)
from ..utils.auth import IsAdminOrJefatura

class LaboratorioListView(generics.ListAPIView):
    """Devuelve la lista de laboratorios.
    ID-07 CORREGIDO: estudiantes reciben SOLO los labs de su carrera (server-side,
    no bypasseable). Docentes/admin pueden usar ?tipo_nombres= como filtro opcional."""
    permission_classes = [IsAuthenticated]
    serializer_class = LaboratorioListSerializer

    def get_queryset(self):
        from django.db.models import Q
        qs = Laboratorio.objects.all()
        user = self.request.user

        if user.id_rol.nombre == 'estudiante':
            # Forzar filtro por carrera — no depende del cliente
            try:
                carrera = user.perfilestudiante.id_carrera.nombre.lower()
            except Exception:
                carrera = ''

            tipo_map = {
                'sistem': 'computo', 'computo': 'computo',
                'ambient': 'ambiental', 'electr': 'electronica',
            }
            tipos_forzados = ['fisica']  # siempre disponible para todos
            for kw, tipo in tipo_map.items():
                if kw in carrera:
                    tipos_forzados.append(tipo)
                    break

            q = Q()
            for t in tipos_forzados:
                q |= Q(id_tipo__nombre__icontains=t)
            qs = qs.filter(q)
        else:
            # Docente / admin_lab / jefatura: filtro opcional por query param
            tipo_nombres = self.request.query_params.get('tipo_nombres')
            if tipo_nombres:
                tipos = [t.strip() for t in tipo_nombres.split(',') if t.strip()]
                q = Q()
                for tipo in tipos:
                    q |= Q(id_tipo__nombre__icontains=tipo)
                qs = qs.filter(q)

        return qs

class LaboratorioDetailView(generics.RetrieveAPIView):
    """Devuelve el detalle de un lab y sus PCs"""
    permission_classes = [IsAuthenticated]
    queryset = Laboratorio.objects.all()
    serializer_class = LaboratorioDetailSerializer
    lookup_field = 'id_laboratorio'

from rest_framework.response import Response
from reservas.services import laboratorio_service

class ActivoLaboratorioUpdateView(generics.UpdateAPIView):
    """Permite cambiar el estado de una PC (Operativo/Mantenimiento)"""
    permission_classes = [IsAdminOrJefatura]
    queryset = ActivoLaboratorio.objects.all()
    serializer_class = ActivoLaboratorioSerializer
    lookup_field = 'id_activo'


    def update(self, request, *args, **kwargs):
        # Obtenemos el ID de la URL y el nuevo estado del body JSON
        id_activo = kwargs.get('id_activo')
        nuevo_estado = request.data.get('estado')

        if not nuevo_estado:
            return Response({"error": "El campo 'estado' es requerido."}, status=400)

        # ID-12: se pasa motivo y el usuario real para que el historial no sea falsificado
        motivo = request.data.get('motivo', 'Cambio manual')
        activo, laboratorio, mensajes, error = laboratorio_service.actualizar_estado_activo(
            id_activo, nuevo_estado, motivo=motivo, usuario_id=request.user.id_usuario
        )

        if error:
            return Response({"error": error}, status=400)

        # Devolvemos el estado de la PC y un aviso si el lab se inhabilitó
        return Response({
            "mensaje": f"Equipo {activo.num_serie} actualizado a {activo.estado}",
            "laboratorio_id": laboratorio.id_laboratorio,
            "laboratorio_habilitado": laboratorio.habilitado,
            "reasignaciones": mensajes
        })