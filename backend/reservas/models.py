from django.db import models

class Rol(models.Model):
    id_rol = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=50, unique=True)

    class Meta:
        db_table = 'rol'

class Facultad(models.Model):
    id_facultad = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=100, unique=True)

    class Meta:
        db_table = 'facultad'

class Carrera(models.Model):
    id_carrera = models.AutoField(primary_key=True)
    id_facultad = models.ForeignKey(Facultad, on_delete=models.CASCADE, db_column='id_facultad')
    nombre = models.CharField(max_length=100)

    class Meta:
        db_table = 'carrera'

class TipoLaboratorio(models.Model):
    id_tipo = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=60, unique=True)
    min_equipos = models.IntegerField()
    tipo_equipo_minimo = models.CharField(max_length=20)

    class Meta:
        db_table = 'tipo_laboratorio'

class TipoActivo(models.Model):
    id_tipo_activo = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=50, unique=True)

    class Meta:
        db_table = 'tipo_activo'

class Usuario(models.Model):
    id_usuario = models.AutoField(primary_key=True)
    id_rol = models.ForeignKey(Rol, on_delete=models.CASCADE, db_column='id_rol')
    nombre = models.CharField(max_length=120)
    email = models.EmailField(max_length=150, unique=True)
    password_hash = models.CharField(max_length=255)
    codigo_universitario = models.CharField(max_length=20, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'usuario'

class PerfilEstudiante(models.Model):
    id_perfil = models.AutoField(primary_key=True)
    id_usuario = models.OneToOneField(Usuario, on_delete=models.CASCADE, db_column='id_usuario')
    id_carrera = models.ForeignKey(Carrera, on_delete=models.CASCADE, db_column='id_carrera')
    ciclo = models.SmallIntegerField()

    class Meta:
        db_table = 'perfil_estudiante'

class PerfilDocente(models.Model):
    id_perfil = models.AutoField(primary_key=True)
    id_usuario = models.OneToOneField(Usuario, on_delete=models.CASCADE, db_column='id_usuario')
    departamento = models.CharField(max_length=100)

    class Meta:
        db_table = 'perfil_docente'

class PasswordReset(models.Model):
    id_usuario = models.ForeignKey(Usuario, on_delete=models.CASCADE, db_column='id_usuario')
    token_hash = models.CharField(max_length=255, unique=True)
    fecha_expiracion = models.DateTimeField()
    usado = models.BooleanField(default=False)

    class Meta:
        db_table = 'password_reset'

class Laboratorio(models.Model):
    id_laboratorio = models.AutoField(primary_key=True)
    id_tipo = models.ForeignKey(TipoLaboratorio, on_delete=models.CASCADE, db_column='id_tipo')
    id_facultad = models.ForeignKey(Facultad, on_delete=models.CASCADE, db_column='id_facultad')
    nombre = models.CharField(max_length=100)
    codigo_patrimonio = models.CharField(max_length=30, unique=True)
    aforo_maximo = models.IntegerField()
    habilitado = models.BooleanField(default=False)

    class Meta:
        db_table = 'laboratorio'

class ActivoLaboratorio(models.Model):
    id_activo = models.AutoField(primary_key=True)
    id_laboratorio = models.ForeignKey(Laboratorio, on_delete=models.CASCADE, db_column='id_laboratorio')
    id_tipo_activo = models.ForeignKey(TipoActivo, on_delete=models.CASCADE, db_column='id_tipo_activo')
    num_serie = models.CharField(max_length=60, unique=True)
    codigo_patrimonio = models.CharField(max_length=30, null=True, blank=True)
    estado = models.CharField(max_length=20, default='Operativo')
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'activo_laboratorio'

class HorarioDisponible(models.Model):
    id_horario = models.AutoField(primary_key=True)
    id_laboratorio = models.ForeignKey(Laboratorio, on_delete=models.CASCADE, db_column='id_laboratorio')
    fecha = models.DateField()
    hora_inicio = models.TimeField()
    hora_fin = models.TimeField()
    capacidad_total = models.IntegerField()
    capacidad_ocupada = models.IntegerField(default=0)
    estado = models.CharField(max_length=20, default='Disponible')

    class Meta:
        db_table = 'horario_disponible'
        unique_together = ('id_laboratorio', 'fecha', 'hora_inicio')

class Reserva(models.Model):
    id_reserva = models.AutoField(primary_key=True)
    id_usuario = models.ForeignKey(Usuario, on_delete=models.CASCADE, db_column='id_usuario')
    id_horario = models.ForeignKey(HorarioDisponible, on_delete=models.CASCADE, db_column='id_horario')
    acepto_declaracion_jurada = models.BooleanField(default=False)
    estado = models.CharField(max_length=20, default='Programada')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'reserva'

class ReservaDetalle(models.Model):
    id_detalle = models.AutoField(primary_key=True)
    id_reserva = models.ForeignKey(Reserva, on_delete=models.CASCADE, db_column='id_reserva')
    id_activo = models.ForeignKey(ActivoLaboratorio, on_delete=models.CASCADE, db_column='id_activo')

    class Meta:
        db_table = 'reserva_detalle'
        unique_together = ('id_reserva', 'id_activo')

class Asistencia(models.Model):
    id_asistencia = models.AutoField(primary_key=True)
    id_reserva = models.OneToOneField(Reserva, on_delete=models.CASCADE, db_column='id_reserva')
    hora_ingreso = models.DateTimeField(null=True, blank=True)
    hora_salida = models.DateTimeField(null=True, blank=True)
    asistio = models.BooleanField(default=False)

    class Meta:
        db_table = 'asistencia'

class Incidencia(models.Model):
    id_incidencia = models.AutoField(primary_key=True)
    id_detalle = models.ForeignKey(ReservaDetalle, on_delete=models.CASCADE, db_column='id_detalle')
    id_activo = models.ForeignKey(ActivoLaboratorio, on_delete=models.CASCADE, db_column='id_activo')
    descripcion_dano = models.TextField()
    fecha_reporte = models.DateTimeField(auto_now_add=True)
    estado_activo_post = models.CharField(max_length=20)

    class Meta:
        db_table = 'incidencia'

class Penalizacion(models.Model):
    id_penalizacion = models.AutoField(primary_key=True)
    id_usuario = models.ForeignKey(Usuario, on_delete=models.CASCADE, db_column='id_usuario')
    id_reserva = models.OneToOneField(Reserva, on_delete=models.CASCADE, db_column='id_reserva')
    fecha_inicio = models.DateTimeField(auto_now_add=True)
    fecha_fin = models.DateTimeField()

    class Meta:
        db_table = 'penalizacion'
