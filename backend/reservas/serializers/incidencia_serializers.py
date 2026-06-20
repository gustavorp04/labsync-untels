from rest_framework import serializers
from reservas.models import Incidencia

class IncidenciaSerializer(serializers.ModelSerializer):
    # Traemos datos de tablas relacionadas para que el frontend no sufra
    pc_codigo = serializers.CharField(source='id_activo.codigo_patrimonio', read_only=True)
    laboratorio_nombre = serializers.CharField(source='id_activo.id_laboratorio.nombre', read_only=True)
    usuario_reporta = serializers.CharField(source='id_detalle.id_reserva.id_usuario.nombre', read_only=True)
    fecha_formateada = serializers.DateTimeField(source='fecha_reporte', format="%d/%m/%Y %H:%M", read_only=True)

    class Meta:
        model = Incidencia
        fields = [
            'id_incidencia',
            'pc_codigo',
            'laboratorio_nombre',
            'descripcion_dano',
            'usuario_reporta',
            'fecha_formateada',
            'estado_activo_post',
            'imagen',
        ]