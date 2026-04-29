from rest_framework import serializers
from reservas.models import Reserva, Asistencia

class ReservaSerializer(serializers.ModelSerializer):
    usuario_nombre = serializers.CharField(source='id_usuario.nombre', read_only=True)
    laboratorio_nombre = serializers.CharField(source='id_horario.id_laboratorio.nombre', read_only=True)
    
    class Meta:
        model = Reserva
        fields = ['id_reserva', 'usuario_nombre', 'laboratorio_nombre', 'estado']

class AsistenciaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Asistencia
        fields = '__all__'