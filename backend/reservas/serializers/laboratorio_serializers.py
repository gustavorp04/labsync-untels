from rest_framework import serializers
from reservas.models import Laboratorio, ActivoLaboratorio, Facultad, TipoLaboratorio

# 1. Serializador para los equipos (PCs, Laptops, etc.)
class ActivoLaboratorioSerializer(serializers.ModelSerializer):
    # Traemos el nombre del tipo (ej. "PC") en lugar del ID
    tipo_activo = serializers.CharField(source='id_tipo_activo.nombre', read_only=True)

    class Meta:
        model = ActivoLaboratorio
        fields = [
            'id_activo', 
            'tipo_activo', 
            'num_serie', 
            'codigo_patrimonio', 
            'estado', 
            'updated_at'
        ]

# 2. Serializador específico para el Dashboard / Lista General
class LaboratorioListSerializer(serializers.ModelSerializer):
    # Información procesada para que el frontend no trabaje de más
    tipo_nombre = serializers.CharField(source='id_tipo.nombre', read_only=True)
    facultad_nombre = serializers.CharField(source='id_facultad.nombre', read_only=True)
    equipos_operativos = serializers.SerializerMethodField()
    estado_sistema = serializers.SerializerMethodField()
    nombre = serializers.SerializerMethodField()

    class Meta:
        model = Laboratorio
        fields = [
            'id_laboratorio', 
            'nombre', 
            'tipo_nombre', 
            'facultad_nombre', 
            'aforo_maximo', 
            'equipos_operativos',
            'estado_sistema',
            'habilitado'
        ]

    def get_nombre(self, obj):
        return f"{obj.nombre} ({obj.codigo_patrimonio})"

    def get_equipos_operativos(self, obj):
        # A-3: Usa la anotación 'equipos_operativos_count' del queryset si está
        # disponible (inyectada por LaboratorioListView / LaboratorioViewSet).
        # Evita disparar una query COUNT por cada laboratorio en la lista.
        if hasattr(obj, 'equipos_operativos_count'):
            return obj.equipos_operativos_count
        # Fallback seguro si se instancia fuera de un queryset anotado
        return obj.activolaboratorio_set.filter(
            id_tipo_activo__nombre__in=['CPU', 'Mesa'],
            estado='Operativo'
        ).count()

    def get_estado_sistema(self, obj):
        # Lógica de negocio: Si tiene menos del mínimo de equipos de su tipo, está "En Mantenimiento"
        operativos = self.get_equipos_operativos(obj)
        minimo_requerido = obj.id_tipo.min_equipos
        return "Disponible" if operativos >= minimo_requerido else "Mantenimiento"

# 3. Serializador para el detalle (Cuando entras a un lab específico)
class LaboratorioDetailSerializer(serializers.ModelSerializer):
    # Anidamos los activos para ver la lista de todas las PCs del lab
    activos = ActivoLaboratorioSerializer(source='activolaboratorio_set', many=True, read_only=True)
    tipo_detalle = serializers.CharField(source='id_tipo.nombre', read_only=True)
    facultad_detalle = serializers.CharField(source='id_facultad.nombre', read_only=True)
    nombre_completo = serializers.SerializerMethodField()

    class Meta:
        model = Laboratorio
        fields = [
            'id_laboratorio', 
            'nombre_completo', 
            'codigo_patrimonio', 
            'aforo_maximo', 
            'tipo_detalle', 
            'facultad_detalle', 
            'habilitado', 
            'activos'
        ]

    def get_nombre_completo(self, obj):
        return f"{obj.nombre} ({obj.codigo_patrimonio})"