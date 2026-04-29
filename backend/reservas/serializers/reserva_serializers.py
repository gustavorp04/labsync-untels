from rest_framework import serializers
from django.utils import timezone
from datetime import timedelta
from ..models import Reserva, HorarioDisponible, Asistencia

class CrearReservaSerializer(serializers.Serializer):
    id_horario = serializers.IntegerField(required=True)
    cantidad_alumnos = serializers.IntegerField(required=True, min_value=1)
    acepto_declaracion_jurada = serializers.BooleanField(required=True)

    def validate_acepto_declaracion_jurada(self, value):
        if not value:
            raise serializers.ValidationError("Debe aceptar la declaración jurada para reservar el laboratorio.")
        return value

    def validate(self, data):
        try:
            horario = HorarioDisponible.objects.get(pk=data['id_horario'])
        except HorarioDisponible.DoesNotExist:
            raise serializers.ValidationError({"id_horario": "El horario especificado no existe."})

        # Regla: 1 día de anticipación como mínimo
        fecha_reserva = horario.fecha
        manana = timezone.now().date() + timedelta(days=1)
        if fecha_reserva < manana:
            raise serializers.ValidationError("La reserva debe realizarse con al menos 1 día de anticipación.")

        # Regla: aforo máximo
        if data['cantidad_alumnos'] > horario.capacidad_total:
            raise serializers.ValidationError(f"La cantidad de alumnos ({data['cantidad_alumnos']}) supera la capacidad del laboratorio ({horario.capacidad_total}).")

        # Pasamos el horario validado para no buscarlo otra vez en el service
        data['horario_obj'] = horario
        return data

class ReservaSerializer(serializers.ModelSerializer):
    usuario_nombre = serializers.CharField(source='id_usuario.nombre', read_only=True)
    laboratorio_nombre = serializers.CharField(source='id_horario.id_laboratorio.nombre', read_only=True)
    fecha_reserva = serializers.DateField(source='id_horario.fecha', read_only=True)
    hora_inicio = serializers.TimeField(source='id_horario.hora_inicio', read_only=True)
    hora_fin = serializers.TimeField(source='id_horario.hora_fin', read_only=True)

    class Meta:
        model = Reserva
        fields = ['id_reserva', 'usuario_nombre', 'laboratorio_nombre', 'fecha_reserva', 'hora_inicio', 'hora_fin', 'cantidad_alumnos', 'estado', 'created_at']

class AsistenciaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Asistencia
        fields = '__all__'

class HorarioDisponibleSerializer(serializers.ModelSerializer):
    laboratorio_nombre = serializers.CharField(source='id_laboratorio.nombre', read_only=True)
    class Meta:
        model = HorarioDisponible
        fields = ['id_horario', 'laboratorio_nombre', 'fecha', 'hora_inicio', 'hora_fin', 'estado', 'capacidad_total']