from rest_framework import serializers
from django.utils import timezone
from datetime import timedelta, datetime as dt_datetime
from ..models import Reserva, HorarioDisponible, Asistencia, HistorialReserva

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

        # N-1: Misma lógica exacta de 24h que usa reserva_service — compara
        # datetimes completos, no solo fechas, para evitar inconsistencias de UX.
        ahora = timezone.now()
        naive_inicio = dt_datetime.combine(horario.fecha, horario.hora_inicio)
        fecha_hora_inicio = timezone.make_aware(naive_inicio, timezone.get_current_timezone())
        if (fecha_hora_inicio - ahora) < timedelta(hours=24):
            raise serializers.ValidationError("La reserva debe realizarse con al menos 24 horas de anticipación.")

        # Regla: aforo máximo
        if data['cantidad_alumnos'] > horario.capacidad_total:
            raise serializers.ValidationError(f"La cantidad de alumnos ({data['cantidad_alumnos']}) supera la capacidad del laboratorio ({horario.capacidad_total}).")

        # Pasamos el horario validado para no buscarlo otra vez en el service
        data['horario_obj'] = horario
        return data

class ReservaSerializer(serializers.ModelSerializer):
    usuario_nombre = serializers.CharField(source='id_usuario.nombre', read_only=True)
    usuario_rol = serializers.CharField(source='id_usuario.id_rol.nombre', read_only=True)
    # N-3: exponer el id del usuario dueño para que el admin pueda usar la ruta cancelar anidada
    usuario_id = serializers.IntegerField(source='id_usuario.id_usuario', read_only=True)
    laboratorio_nombre = serializers.SerializerMethodField()
    fecha_reserva = serializers.DateField(source='id_horario.fecha', read_only=True)
    hora_inicio = serializers.TimeField(source='id_horario.hora_inicio', read_only=True)
    hora_fin = serializers.TimeField(source='id_horario.hora_fin', read_only=True)
    activos = serializers.SerializerMethodField()
    id_laboratorio = serializers.IntegerField(source='id_horario.id_laboratorio.id_laboratorio', read_only=True)
    historial_cambios = serializers.SerializerMethodField()

    class Meta:
        model = Reserva
        fields = [
            'id_reserva', 'usuario_nombre', 'usuario_rol', 'usuario_id', 'laboratorio_nombre',
            'fecha_reserva', 'hora_inicio', 'hora_fin', 'cantidad_alumnos',
            'estado', 'created_at', 'updated_at', 'activos', 'id_horario', 'id_laboratorio',
            'historial_cambios'
        ]

    def get_laboratorio_nombre(self, obj):
        lab = obj.id_horario.id_laboratorio
        return f"{lab.nombre} ({lab.codigo_patrimonio})"

    def get_activos(self, obj):
        # Usamos all() para aprovechar prefetch_related y evitar N+1 queries
        detalles = obj.reservadetalle_set.all()
        return [
            {
                'id_activo': d.id_activo.id_activo,
                'num_serie': d.id_activo.num_serie,
                'codigo_patrimonio': d.id_activo.codigo_patrimonio,
                'tipo_activo_nombre': d.id_activo.id_tipo_activo.nombre,
                'estado': d.id_activo.estado
            }
            for d in detalles
        ]

    def get_historial_cambios(self, obj):
        # Usamos all() y ordenamos en memoria para aprovechar prefetch_related y evitar N+1 queries
        logs = sorted(
            obj.historialreserva_set.all(),
            key=lambda x: x.fecha_cambio if x.fecha_cambio else timezone.now()
        )
        return [
            {
                'estado_anterior': log.estado_anterior,
                'estado_nuevo': log.estado_nuevo,
                'fecha_cambio': log.fecha_cambio.strftime('%d/%m/%Y %H:%M:%S') if log.fecha_cambio else '',
                'observacion': log.observacion
            }
            for log in logs
        ]


class AsistenciaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Asistencia
        fields = '__all__'

class HorarioDisponibleSerializer(serializers.ModelSerializer):
    laboratorio_nombre = serializers.SerializerMethodField()
    tipo_nombre = serializers.CharField(source='id_laboratorio.id_tipo.nombre', read_only=True)
    aforo_maximo = serializers.IntegerField(source='id_laboratorio.aforo_maximo', read_only=True)
    es_reservable = serializers.SerializerMethodField()

    class Meta:
        model = HorarioDisponible
        fields = ['id_horario', 'laboratorio_nombre', 'tipo_nombre', 'aforo_maximo', 'fecha', 'hora_inicio', 'hora_fin', 'estado', 'capacidad_total', 'es_reservable']

    def get_es_reservable(self, obj):
        # N-2: Misma regla de 24h exactas que el service para que el botón
        # en el frontend refleje lo que el backend va a aceptar.
        ahora = timezone.now()
        naive_inicio = dt_datetime.combine(obj.fecha, obj.hora_inicio)
        fecha_hora_inicio = timezone.make_aware(naive_inicio, timezone.get_current_timezone())
        return (fecha_hora_inicio - ahora) >= timedelta(hours=24)

    def get_laboratorio_nombre(self, obj):
        lab = obj.id_laboratorio
        return f"{lab.nombre} ({lab.codigo_patrimonio})"

class HistorialReservaSerializer(serializers.ModelSerializer):
    usuario_nombre = serializers.CharField(source='usuario_cambio.nombre', read_only=True)
    usuario_rol = serializers.CharField(source='usuario_cambio.id_rol.nombre', read_only=True)
    reserva_id = serializers.IntegerField(source='reserva.id_reserva', read_only=True)
    laboratorio = serializers.SerializerMethodField()

    class Meta:
        model = HistorialReserva
        fields = ['id_historial', 'reserva_id', 'estado_anterior', 'estado_nuevo', 'fecha_cambio', 'usuario_nombre', 'usuario_rol', 'observacion', 'laboratorio']

    def get_laboratorio(self, obj):
        lab = obj.reserva.id_horario.id_laboratorio
        return f"{lab.nombre} ({lab.codigo_patrimonio})"