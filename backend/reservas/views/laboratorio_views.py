from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from reservas.models import Laboratorio
from reservas.serializers.laboratorio_serializers import (
    LaboratorioListSerializer,
    LaboratorioDetailSerializer,
)

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