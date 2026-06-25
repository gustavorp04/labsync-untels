from django.db import models


class ActivoLaboratorio(models.Model):
    id_activo = models.AutoField(primary_key=True)
    id_laboratorio = models.ForeignKey('Laboratorio', models.PROTECT, db_column='id_laboratorio')
    id_tipo_activo = models.ForeignKey('TipoActivo', models.PROTECT, db_column='id_tipo_activo')
    num_serie = models.CharField(unique=True, max_length=60)
    codigo_patrimonio = models.CharField(max_length=30, blank=True, null=True)
    ESTADOS = [
        ('Operativo', 'Operativo'),
        ('Mantenimiento', 'Mantenimiento'),
        ('Dado de baja', 'Dado de baja'),
    ]
    estado = models.CharField(max_length=20, choices=ESTADOS)
    updated_at = models.DateTimeField()
    fila = models.IntegerField(null=True, blank=True)
    columna = models.IntegerField(null=True, blank=True)

    class Meta:
        managed = True
        db_table = 'activo_laboratorio'
        indexes = [
            models.Index(fields=['id_laboratorio', 'estado'], name='activo_lab_estado_idx'),
        ]
        constraints = [
            models.CheckConstraint(
                check=models.Q(estado__in=['Operativo', 'Mantenimiento', 'Dado de baja']),
                name='activo_estado_valido',
            )
        ]


class Asistencia(models.Model):
    id_asistencia = models.AutoField(primary_key=True)
    id_reserva = models.OneToOneField('Reserva', models.CASCADE, db_column='id_reserva')
    hora_ingreso = models.DateTimeField(blank=True, null=True)
    hora_salida = models.DateTimeField(blank=True, null=True)
    asistio = models.BooleanField()

    class Meta:
        managed = True
        db_table = 'asistencia'


class Carrera(models.Model):
    id_carrera = models.AutoField(primary_key=True)
    id_facultad = models.ForeignKey('Facultad', models.PROTECT, db_column='id_facultad')
    nombre = models.CharField(max_length=100)

    class Meta:
        managed = True
        db_table = 'carrera'


class CategoriaActivo(models.Model):
    id_categoria = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=60)
    descripcion = models.CharField(max_length=200, blank=True, null=True)

    class Meta:
        managed = True
        db_table = 'categoria_activo'


class Facultad(models.Model):
    id_facultad = models.AutoField(primary_key=True)
    nombre = models.CharField(unique=True, max_length=100)

    class Meta:
        managed = True
        db_table = 'facultad'


class HorarioDisponible(models.Model):
    id_horario = models.AutoField(primary_key=True)
    id_laboratorio = models.ForeignKey('Laboratorio', models.PROTECT, db_column='id_laboratorio')
    fecha = models.DateField()
    hora_inicio = models.TimeField()
    hora_fin = models.TimeField()
    capacidad_total = models.IntegerField()
    capacidad_ocupada = models.IntegerField()
    estado = models.CharField(max_length=20)

    class Meta:
        managed = True
        db_table = 'horario_disponible'
        unique_together = (('id_laboratorio', 'fecha', 'hora_inicio'),)
        indexes = [
            models.Index(fields=['fecha', 'estado'], name='horario_fecha_estado_idx'),
            models.Index(fields=['fecha'], name='horario_fecha_idx'),
        ]
        constraints = [
            models.CheckConstraint(
                check=models.Q(estado__in=['Disponible', 'Completo', 'Inhabilitado']),
                name='horario_estado_valido',
            )
        ]


class Incidencia(models.Model):
    id_incidencia = models.AutoField(primary_key=True)
    id_detalle = models.ForeignKey('ReservaDetalle', models.PROTECT, db_column='id_detalle')
    id_activo = models.ForeignKey(ActivoLaboratorio, models.PROTECT, db_column='id_activo')
    descripcion_dano = models.TextField()
    fecha_reporte = models.DateTimeField()
    estado_activo_post = models.CharField(max_length=20)
    imagen = models.ImageField(upload_to='incidencias/', blank=True, null=True)

    class Meta:
        managed = True
        db_table = 'incidencia'


class Laboratorio(models.Model):
    id_laboratorio = models.AutoField(primary_key=True)
    id_tipo = models.ForeignKey('TipoLaboratorio', models.PROTECT, db_column='id_tipo')
    id_facultad = models.ForeignKey(Facultad, models.PROTECT, db_column='id_facultad')
    nombre = models.CharField(max_length=100)
    codigo_patrimonio = models.CharField(unique=True, max_length=30)
    aforo_maximo = models.IntegerField()
    habilitado = models.BooleanField()
    TIPOS_LAYOUT = [
        ('GRID', 'Cuadrícula Clásica'),
        ('MESAS', 'Mesas de Trabajo')
    ]
    tipo_layout = models.CharField(max_length=10, choices=TIPOS_LAYOUT, default='GRID')
    imagen_inhabilitacion = models.ImageField(upload_to='inhabilitaciones/', blank=True, null=True)

    class Meta:
        managed = True
        db_table = 'laboratorio'


class PasswordReset(models.Model):
    id_usuario = models.ForeignKey('Usuario', models.CASCADE, db_column='id_usuario')
    token_hash = models.CharField(unique=True, max_length=255)
    fecha_expiracion = models.DateTimeField()
    usado = models.BooleanField()

    class Meta:
        managed = True
        db_table = 'password_reset'


class Penalizacion(models.Model):
    id_penalizacion = models.AutoField(primary_key=True)
    id_usuario = models.ForeignKey('Usuario', models.PROTECT, db_column='id_usuario')
    id_reserva = models.OneToOneField('Reserva', models.PROTECT, db_column='id_reserva')
    fecha_inicio = models.DateTimeField()
    fecha_fin = models.DateTimeField()
    # PBI-07: motivo de la penalización y seguimiento de notificación de expiración
    motivo = models.CharField(max_length=200, blank=True, null=True)
    notificado_expiracion = models.BooleanField(default=False)

    class Meta:
        managed = True
        db_table = 'penalizacion'


class PerfilDocente(models.Model):
    id_perfil = models.AutoField(primary_key=True)
    id_usuario = models.OneToOneField('Usuario', models.CASCADE, db_column='id_usuario')
    departamento = models.CharField(max_length=100)

    class Meta:
        managed = True
        db_table = 'perfil_docente'


class PerfilEstudiante(models.Model):
    id_perfil = models.AutoField(primary_key=True)
    id_usuario = models.OneToOneField('Usuario', models.CASCADE, db_column='id_usuario')
    id_carrera = models.ForeignKey(Carrera, models.PROTECT, db_column='id_carrera')
    ciclo = models.SmallIntegerField()

    class Meta:
        managed = True
        db_table = 'perfil_estudiante'


class Reserva(models.Model):
    ESTADOS = [
        ('Programada', 'Programada'),
        ('Pendiente', 'Pendiente'),
        ('Cancelada', 'Cancelada'),
        ('Completada', 'Completada'),
        ('No-show', 'No-show'),
    ]
    id_reserva = models.AutoField(primary_key=True)
    id_usuario = models.ForeignKey('Usuario', models.PROTECT, db_column='id_usuario')
    id_horario = models.ForeignKey(HorarioDisponible, models.PROTECT, db_column='id_horario')
    cantidad_alumnos = models.IntegerField()
    acepto_declaracion_jurada = models.BooleanField()
    estado = models.CharField(max_length=20, choices=ESTADOS)
    created_at = models.DateTimeField()
    updated_at = models.DateTimeField()

    class Meta:
        managed = True
        db_table = 'reserva'
        indexes = [
            models.Index(fields=['estado'], name='reserva_estado_idx'),
            models.Index(fields=['id_horario', 'estado'], name='reserva_horario_estado_idx'),
        ]
        constraints = [
            # ID-11: constraint a nivel de BD — Django choices solo valida en forms/serializers.
            models.CheckConstraint(
                check=models.Q(estado__in=['Programada', 'Pendiente', 'Cancelada', 'Completada', 'No-show']),
                name='reserva_estado_valido',
            )
        ]


class ReservaDetalle(models.Model):
    id_detalle = models.AutoField(primary_key=True)
    id_reserva = models.ForeignKey(Reserva, models.CASCADE, db_column='id_reserva')
    id_activo = models.ForeignKey(ActivoLaboratorio, models.PROTECT, db_column='id_activo')

    class Meta:
        managed = True
        db_table = 'reserva_detalle'
        unique_together = (('id_reserva', 'id_activo'),)


class Rol(models.Model):
    id_rol = models.AutoField(primary_key=True)
    nombre = models.CharField(unique=True, max_length=50)

    class Meta:
        managed = True
        db_table = 'rol'


class TipoActivo(models.Model):
    id_tipo_activo = models.AutoField(primary_key=True)
    id_categoria = models.ForeignKey(CategoriaActivo, models.PROTECT, db_column='id_categoria')
    nombre = models.CharField(unique=True, max_length=50)
    descripcion = models.CharField(max_length=200, blank=True, null=True)

    class Meta:
        managed = True
        db_table = 'tipo_activo'


class TipoLaboratorio(models.Model):
    id_tipo = models.AutoField(primary_key=True)
    nombre = models.CharField(unique=True, max_length=60)
    min_equipos = models.IntegerField()
    tipo_equipo_minimo = models.CharField(max_length=20)

    class Meta:
        managed = True
        db_table = 'tipo_laboratorio'


class Usuario(models.Model):
    id_usuario = models.AutoField(primary_key=True)
    id_rol = models.ForeignKey(Rol, models.PROTECT, db_column='id_rol')
    nombre = models.CharField(max_length=120)
    email = models.CharField(unique=True, max_length=150)
    password_hash = models.CharField(max_length=255)
    codigo_universitario = models.CharField(unique=True, max_length=20)
    created_at = models.DateTimeField()

    @property
    def is_authenticated(self):
        return True

    class Meta:
        managed = True
        db_table = 'usuario'


class HistorialMantenimiento(models.Model):
    id_historial = models.AutoField(primary_key=True)
    id_activo = models.ForeignKey(ActivoLaboratorio, models.PROTECT, db_column='id_activo')
    estado_anterior = models.CharField(max_length=20)
    estado_nuevo = models.CharField(max_length=20)
    motivo = models.TextField(blank=True, null=True)
    id_incidencia = models.ForeignKey(Incidencia, models.SET_NULL, db_column='id_incidencia', blank=True, null=True)
    fecha_cambio = models.DateTimeField()
    registrado_por = models.ForeignKey(Usuario, models.PROTECT, db_column='registrado_por')
    imagen = models.ImageField(upload_to='mantenimiento/', blank=True, null=True)

    class Meta:
        managed = True
        db_table = 'historial_mantenimiento'


class ConfiguracionSistema(models.Model):
    id_config = models.AutoField(primary_key=True)
    clave = models.CharField(unique=True, max_length=50)
    valor = models.TextField()
    descripcion = models.TextField(blank=True, null=True)
    updated_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = True
        db_table = 'configuracion_sistema'


class HistorialReserva(models.Model):
    id_historial = models.AutoField(primary_key=True)
    reserva = models.ForeignKey('Reserva', models.CASCADE, db_column='id_reserva')
    estado_anterior = models.CharField(max_length=20)
    estado_nuevo = models.CharField(max_length=20)
    fecha_cambio = models.DateTimeField(auto_now_add=True)
    usuario_cambio = models.ForeignKey('Usuario', models.SET_NULL, db_column='usuario_cambio', null=True)
    observacion = models.TextField(blank=True, null=True)

    class Meta:
        managed = True
        db_table = 'historial_reserva'


class SesionUsuario(models.Model):
    id_sesion = models.AutoField(primary_key=True)
    id_usuario = models.ForeignKey('Usuario', models.CASCADE, db_column='id_usuario')
    token = models.CharField(max_length=255, unique=True)
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_expiracion = models.DateTimeField()

    class Meta:
        managed = True
        db_table = 'sesion_usuario'


class RecordatorioEnviado(models.Model):
    """PBI-11: Registro de recordatorios enviados para evitar duplicados."""
    TIPOS = [
        ('24h', '24 horas antes'),
    ]
    id_recordatorio = models.AutoField(primary_key=True)
    id_reserva = models.ForeignKey('Reserva', models.CASCADE, db_column='id_reserva',
                                   related_name='recordatorios')
    tipo = models.CharField(max_length=10, choices=TIPOS, default='24h')
    fecha_envio = models.DateTimeField(auto_now_add=True)
    exitoso = models.BooleanField(default=True)
    detalle_error = models.TextField(blank=True, null=True)

    class Meta:
        managed = True
        db_table = 'recordatorio_enviado'
        # Garantiza que por cada reserva solo se envíe UN recordatorio de cada tipo
        unique_together = (('id_reserva', 'tipo'),)
