from django.db import models


class ActivoLaboratorio(models.Model):
    id_activo = models.AutoField(primary_key=True)
    id_laboratorio = models.ForeignKey('Laboratorio', models.DO_NOTHING, db_column='id_laboratorio')
    id_tipo_activo = models.ForeignKey('TipoActivo', models.DO_NOTHING, db_column='id_tipo_activo')
    num_serie = models.CharField(unique=True, max_length=60)
    codigo_patrimonio = models.CharField(max_length=30, blank=True, null=True)
    estado = models.CharField(max_length=20)
    updated_at = models.DateTimeField()

    class Meta:
        managed = False
        db_table = 'activo_laboratorio'


class Asistencia(models.Model):
    id_asistencia = models.AutoField(primary_key=True)
    id_reserva = models.OneToOneField('Reserva', models.DO_NOTHING, db_column='id_reserva')
    hora_ingreso = models.DateTimeField(blank=True, null=True)
    hora_salida = models.DateTimeField(blank=True, null=True)
    asistio = models.BooleanField()

    class Meta:
        managed = False
        db_table = 'asistencia'


class Carrera(models.Model):
    id_carrera = models.AutoField(primary_key=True)
    id_facultad = models.ForeignKey('Facultad', models.DO_NOTHING, db_column='id_facultad')
    nombre = models.CharField(max_length=100)

    class Meta:
        managed = False
        db_table = 'carrera'


class CategoriaActivo(models.Model):
    id_categoria = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=60)
    descripcion = models.CharField(max_length=200, blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'categoria_activo'


class Facultad(models.Model):
    id_facultad = models.AutoField(primary_key=True)
    nombre = models.CharField(unique=True, max_length=100)

    class Meta:
        managed = False
        db_table = 'facultad'


class HorarioDisponible(models.Model):
    id_horario = models.AutoField(primary_key=True)
    id_laboratorio = models.ForeignKey('Laboratorio', models.DO_NOTHING, db_column='id_laboratorio')
    fecha = models.DateField()
    hora_inicio = models.TimeField()
    hora_fin = models.TimeField()
    capacidad_total = models.IntegerField()
    capacidad_ocupada = models.IntegerField()
    estado = models.CharField(max_length=20)

    class Meta:
        managed = False
        db_table = 'horario_disponible'
        unique_together = (('id_laboratorio', 'fecha', 'hora_inicio'),)


class Incidencia(models.Model):
    id_incidencia = models.AutoField(primary_key=True)
    id_detalle = models.ForeignKey('ReservaDetalle', models.DO_NOTHING, db_column='id_detalle')
    id_activo = models.ForeignKey(ActivoLaboratorio, models.DO_NOTHING, db_column='id_activo')
    descripcion_dano = models.TextField()
    fecha_reporte = models.DateTimeField()
    estado_activo_post = models.CharField(max_length=20)

    class Meta:
        managed = False
        db_table = 'incidencia'


class Laboratorio(models.Model):
    id_laboratorio = models.AutoField(primary_key=True)
    id_tipo = models.ForeignKey('TipoLaboratorio', models.DO_NOTHING, db_column='id_tipo')
    id_facultad = models.ForeignKey(Facultad, models.DO_NOTHING, db_column='id_facultad')
    nombre = models.CharField(max_length=100)
    codigo_patrimonio = models.CharField(unique=True, max_length=30)
    aforo_maximo = models.IntegerField()
    habilitado = models.BooleanField()

    class Meta:
        managed = False
        db_table = 'laboratorio'


class PasswordReset(models.Model):
    id_usuario = models.ForeignKey('Usuario', models.DO_NOTHING, db_column='id_usuario')
    token_hash = models.CharField(unique=True, max_length=255)
    fecha_expiracion = models.DateTimeField()
    usado = models.BooleanField()

    class Meta:
        managed = False
        db_table = 'password_reset'


class Penalizacion(models.Model):
    id_penalizacion = models.AutoField(primary_key=True)
    id_usuario = models.ForeignKey('Usuario', models.DO_NOTHING, db_column='id_usuario')
    id_reserva = models.OneToOneField('Reserva', models.DO_NOTHING, db_column='id_reserva')
    fecha_inicio = models.DateTimeField()
    fecha_fin = models.DateTimeField()

    class Meta:
        managed = False
        db_table = 'penalizacion'


class PerfilDocente(models.Model):
    id_perfil = models.AutoField(primary_key=True)
    id_usuario = models.OneToOneField('Usuario', models.DO_NOTHING, db_column='id_usuario')
    departamento = models.CharField(max_length=100)

    class Meta:
        managed = False
        db_table = 'perfil_docente'


class PerfilEstudiante(models.Model):
    id_perfil = models.AutoField(primary_key=True)
    id_usuario = models.OneToOneField('Usuario', models.DO_NOTHING, db_column='id_usuario')
    id_carrera = models.ForeignKey(Carrera, models.DO_NOTHING, db_column='id_carrera')
    ciclo = models.SmallIntegerField()

    class Meta:
        managed = False
        db_table = 'perfil_estudiante'


class Reserva(models.Model):
    id_reserva = models.AutoField(primary_key=True)
    id_usuario = models.ForeignKey('Usuario', models.DO_NOTHING, db_column='id_usuario')
    id_horario = models.ForeignKey(HorarioDisponible, models.DO_NOTHING, db_column='id_horario')
    cantidad_alumnos = models.IntegerField()
    acepto_declaracion_jurada = models.BooleanField()
    estado = models.CharField(max_length=20)
    created_at = models.DateTimeField()
    updated_at = models.DateTimeField()

    class Meta:
        managed = False
        db_table = 'reserva'


class ReservaDetalle(models.Model):
    id_detalle = models.AutoField(primary_key=True)
    id_reserva = models.ForeignKey(Reserva, models.DO_NOTHING, db_column='id_reserva')
    id_activo = models.ForeignKey(ActivoLaboratorio, models.DO_NOTHING, db_column='id_activo')

    class Meta:
        managed = False
        db_table = 'reserva_detalle'
        unique_together = (('id_reserva', 'id_activo'),)


class Rol(models.Model):
    id_rol = models.AutoField(primary_key=True)
    nombre = models.CharField(unique=True, max_length=50)

    class Meta:
        managed = False
        db_table = 'rol'


class TipoActivo(models.Model):
    id_tipo_activo = models.AutoField(primary_key=True)
    id_categoria = models.ForeignKey(CategoriaActivo, models.DO_NOTHING, db_column='id_categoria')
    nombre = models.CharField(unique=True, max_length=50)
    descripcion = models.CharField(max_length=200, blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'tipo_activo'


class TipoLaboratorio(models.Model):
    id_tipo = models.AutoField(primary_key=True)
    nombre = models.CharField(unique=True, max_length=60)
    min_equipos = models.IntegerField()
    tipo_equipo_minimo = models.CharField(max_length=20)

    class Meta:
        managed = False
        db_table = 'tipo_laboratorio'


class Usuario(models.Model):
    id_usuario = models.AutoField(primary_key=True)
    id_rol = models.ForeignKey(Rol, models.DO_NOTHING, db_column='id_rol')
    nombre = models.CharField(max_length=120)
    email = models.CharField(unique=True, max_length=150)
    password_hash = models.CharField(max_length=255)
    codigo_universitario = models.CharField(unique=True, max_length=20)
    created_at = models.DateTimeField()

    class Meta:
        managed = False
        db_table = 'usuario'


class HistorialMantenimiento(models.Model):
    id_historial = models.AutoField(primary_key=True)
    id_activo = models.ForeignKey(ActivoLaboratorio, models.DO_NOTHING, db_column='id_activo')
    estado_anterior = models.CharField(max_length=20)
    estado_nuevo = models.CharField(max_length=20)
    motivo = models.TextField(blank=True, null=True)
    id_incidencia = models.ForeignKey(Incidencia, models.DO_NOTHING, db_column='id_incidencia', blank=True, null=True)
    fecha_cambio = models.DateTimeField()
    registrado_por = models.ForeignKey(Usuario, models.DO_NOTHING, db_column='registrado_por')

    class Meta:
        managed = False
        db_table = 'historial_mantenimiento'


class ConfiguracionSistema(models.Model):
    id_config = models.AutoField(primary_key=True)
    clave = models.CharField(unique=True, max_length=50)
    valor = models.TextField()
    descripcion = models.TextField(blank=True, null=True)
    updated_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'configuracion_sistema'

class HistorialReserva(models.Model):
    id_historial = models.AutoField(primary_key=True)
    reserva = models.ForeignKey('Reserva', models.DO_NOTHING, db_column='id_reserva')
    estado_anterior = models.CharField(max_length=20)
    estado_nuevo = models.CharField(max_length=20)
    fecha_cambio = models.DateTimeField(auto_now_add=True)
    usuario_cambio = models.ForeignKey('Usuario', models.DO_NOTHING, db_column='usuario_cambio', null=True)
    observacion = models.TextField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'historial_reserva'
