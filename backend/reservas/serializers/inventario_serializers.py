from rest_framework import serializers
from reservas.models import CategoriaActivo, TipoActivo, ActivoLaboratorio, HistorialMantenimiento, Usuario


class CategoriaActivoSerializer(serializers.ModelSerializer):
    class Meta:
        model = CategoriaActivo
        fields = ['id_categoria', 'nombre', 'descripcion']


class TipoActivoSerializer(serializers.ModelSerializer):
    categoria_nombre = serializers.CharField(source='id_categoria.nombre', read_only=True)

    class Meta:
        model = TipoActivo
        fields = ['id_tipo_activo', 'nombre', 'descripcion', 'categoria_nombre']


class ActivoLaboratorioSerializer(serializers.ModelSerializer):
    tipo_activo_nombre = serializers.CharField(source='id_tipo_activo.nombre', read_only=True)
    categoria_nombre = serializers.CharField(source='id_tipo_activo.id_categoria.nombre', read_only=True)
    laboratorio_nombre = serializers.CharField(source='id_laboratorio.nombre', read_only=True)

    class Meta:
        model = ActivoLaboratorio
        fields = [
            'id_activo',
            'id_laboratorio',
            'laboratorio_nombre',
            'id_tipo_activo',
            'tipo_activo_nombre',
            'categoria_nombre',
            'num_serie',
            'codigo_patrimonio',
            'estado',
            'updated_at',
        ]
        read_only_fields = ['id_activo', 'updated_at', 'laboratorio_nombre', 'tipo_activo_nombre', 'categoria_nombre']


class HistorialMantenimientoSerializer(serializers.ModelSerializer):
    activo_serie = serializers.CharField(source='id_activo.num_serie', read_only=True)
    activo_tipo  = serializers.CharField(source='id_activo.id_tipo_activo.nombre', read_only=True)
    registrado_por_nombre = serializers.CharField(source='registrado_por.nombre', read_only=True)
    registrado_por_rol    = serializers.CharField(source='registrado_por.id_rol.nombre', read_only=True)

    class Meta:
        model = HistorialMantenimiento
        fields = [
            'id_historial',
            'id_activo',
            'activo_serie',
            'activo_tipo',
            'estado_anterior',
            'estado_nuevo',
            'motivo',
            'fecha_cambio',
            'registrado_por',
            'registrado_por_nombre',
            'registrado_por_rol',
        ]
        read_only_fields = ['id_historial', 'fecha_cambio', 'activo_serie', 'activo_tipo', 'registrado_por_nombre', 'registrado_por_rol']
