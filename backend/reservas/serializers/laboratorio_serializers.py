from rest_framework import serializers
from .models import Laboratorio, ActivoLaboratorio

# Serializador para un activo individual (PC, Mouse, etc.)
class ActivoLaboratorioSerializer(serializers.ModelSerializer):
    tipo_activo = serializers.CharField(source='id_tipo_activo.nombre', read_only=True)

    class Meta:
        model = ActivoLaboratorio
        # Estos son los campos exactos que acordaste con el frontend
        fields = ['id_activo', 'tipo_activo', 'num_serie', 'codigo_patrimonio', 'estado', 'updated_at']

# Serializador para el listado general de Laboratorios
class LaboratorioListSerializer(serializers.ModelSerializer):
    tipo_laboratorio = serializers.CharField(source='id_tipo.nombre', read_only=True)
    equipos_operativos = serializers.SerializerMethodField()

    class Meta:
        model = Laboratorio
        fields = ['id_laboratorio', 'nombre', 'tipo_laboratorio', 'aforo_maximo', 'habilitado', 'equipos_operativos']

    def get_equipos_operativos(self, obj):
        # Gracias a la Mejora B (related_name='activos'), contar esto es así de fácil:
        return obj.activos.filter(estado='Operativo').count()

# Serializador para el detalle de un Laboratorio con la lista de sus PCs
class LaboratorioDetailSerializer(serializers.ModelSerializer):
    # Aquí anidamos el serializador de activos para que salgan todos los equipos dentro del JSON
    activos = ActivoLaboratorioSerializer(many=True, read_only=True)

    class Meta:
        model = Laboratorio
        fields = ['id_laboratorio', 'nombre', 'habilitado', 'activos']