from django.db import models


class Usuario(models.Model):
    nombre = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    password_hash = models.TextField()
    rol = models.CharField(max_length=20)
    categoria = models.CharField(max_length=50, blank=True, null=True)
    estado = models.CharField(max_length=20, default='ACTIVO')
    fecha_fin_penalizacion = models.DateField(blank=True, null=True)
    codigo_universitario = models.CharField(max_length=20)
    ciclo = models.IntegerField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    reset_token = models.CharField(max_length=10, null=True, blank=True)

    class Meta:
        db_table = 'usuario'


class Laboratorio(models.Model):
    nombre = models.CharField(max_length=100)
    categoria = models.CharField(max_length=50)
    aforo_maximo = models.IntegerField()
    tipo = models.CharField(max_length=50)
    estado = models.CharField(max_length=20, default='DISPONIBLE')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'laboratorio'


class Equipo(models.Model):
    laboratorio = models.ForeignKey(Laboratorio, on_delete=models.CASCADE)
    codigo_interno = models.CharField(max_length=20, unique=True)
    num_serie = models.CharField(max_length=20, unique=True)
    tipo = models.CharField(max_length=20)
    estado = models.CharField(max_length=20, default='OPERATIVO')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'equipo'


class Reserva(models.Model):
    usuario = models.ForeignKey(Usuario, on_delete=models.CASCADE)
    laboratorio = models.ForeignKey(Laboratorio, on_delete=models.CASCADE)
    fecha = models.DateField()
    hora_inicio = models.TimeField()
    hora_fin = models.TimeField()
    estado = models.CharField(max_length=20, default='PROGRAMADA')
    cantidad_personas = models.IntegerField(blank=True, null=True)
    declaracion_jurada = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'reserva'


class ReservaEquipo(models.Model):
    reserva = models.ForeignKey(Reserva, on_delete=models.CASCADE)
    equipo = models.ForeignKey(Equipo, on_delete=models.CASCADE)

    class Meta:
        db_table = 'reserva_equipo'
        unique_together = ('reserva', 'equipo')


class Penalizacion(models.Model):
    usuario = models.ForeignKey(Usuario, on_delete=models.CASCADE)
    reserva = models.ForeignKey(Reserva, on_delete=models.CASCADE)
    fecha_inicio = models.DateField()
    fecha_fin = models.DateField()
    motivo = models.TextField()
    estado = models.CharField(max_length=20, default='ACTIVA')

    class Meta:
        db_table = 'penalizacion'


class Incidencia(models.Model):
    equipo = models.ForeignKey(Equipo, on_delete=models.CASCADE)
    reserva = models.ForeignKey(Reserva, on_delete=models.CASCADE)
    usuario = models.ForeignKey(Usuario, on_delete=models.CASCADE)
    descripcion = models.TextField()
    tipo = models.CharField(max_length=50)
    fecha = models.DateField(auto_now_add=True)
    estado = models.CharField(max_length=20, default='REPORTADA')

    class Meta:
        db_table = 'incidencia'


class Asistencia(models.Model):
    reserva = models.OneToOneField(Reserva, on_delete=models.CASCADE)
    estado = models.CharField(max_length=20)
    registrado_por = models.ForeignKey(Usuario, on_delete=models.CASCADE)
    fecha_registro = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'asistencia'



