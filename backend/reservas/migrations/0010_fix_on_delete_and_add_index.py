from django.db import migrations, models
import django.db.models.deletion

class Migration(migrations.Migration):

    dependencies = [
        ('reservas', '0009_image_fields'),
    ]

    operations = [
        migrations.AlterField(
            model_name='activolaboratorio',
            name='id_laboratorio',
            field=models.ForeignKey(db_column='id_laboratorio', on_delete=django.db.models.deletion.PROTECT, to='reservas.laboratorio'),
        ),
        migrations.AlterField(
            model_name='activolaboratorio',
            name='id_tipo_activo',
            field=models.ForeignKey(db_column='id_tipo_activo', on_delete=django.db.models.deletion.PROTECT, to='reservas.tipoactivo'),
        ),
        migrations.AlterField(
            model_name='asistencia',
            name='id_reserva',
            field=models.OneToOneField(db_column='id_reserva', on_delete=django.db.models.deletion.CASCADE, to='reservas.reserva'),
        ),
        migrations.AlterField(
            model_name='carrera',
            name='id_facultad',
            field=models.ForeignKey(db_column='id_facultad', on_delete=django.db.models.deletion.PROTECT, to='reservas.facultad'),
        ),
        migrations.AlterField(
            model_name='horariodisponible',
            name='id_laboratorio',
            field=models.ForeignKey(db_column='id_laboratorio', on_delete=django.db.models.deletion.PROTECT, to='reservas.laboratorio'),
        ),
        migrations.AlterField(
            model_name='incidencia',
            name='id_activo',
            field=models.ForeignKey(db_column='id_activo', on_delete=django.db.models.deletion.PROTECT, to='reservas.activolaboratorio'),
        ),
        migrations.AlterField(
            model_name='incidencia',
            name='id_detalle',
            field=models.ForeignKey(db_column='id_detalle', on_delete=django.db.models.deletion.PROTECT, to='reservas.reservadetalle'),
        ),
        migrations.AlterField(
            model_name='laboratorio',
            name='id_facultad',
            field=models.ForeignKey(db_column='id_facultad', on_delete=django.db.models.deletion.PROTECT, to='reservas.facultad'),
        ),
        migrations.AlterField(
            model_name='laboratorio',
            name='id_tipo',
            field=models.ForeignKey(db_column='id_tipo', on_delete=django.db.models.deletion.PROTECT, to='reservas.tipolaboratorio'),
        ),
        migrations.AlterField(
            model_name='passwordreset',
            name='id_usuario',
            field=models.ForeignKey(db_column='id_usuario', on_delete=django.db.models.deletion.CASCADE, to='reservas.usuario'),
        ),
        migrations.AlterField(
            model_name='penalizacion',
            name='id_reserva',
            field=models.OneToOneField(db_column='id_reserva', on_delete=django.db.models.deletion.PROTECT, to='reservas.reserva'),
        ),
        migrations.AlterField(
            model_name='penalizacion',
            name='id_usuario',
            field=models.ForeignKey(db_column='id_usuario', on_delete=django.db.models.deletion.PROTECT, to='reservas.usuario'),
        ),
        migrations.AlterField(
            model_name='perfildocente',
            name='id_usuario',
            field=models.OneToOneField(db_column='id_usuario', on_delete=django.db.models.deletion.CASCADE, to='reservas.usuario'),
        ),
        migrations.AlterField(
            model_name='perfilestudiante',
            name='id_carrera',
            field=models.ForeignKey(db_column='id_carrera', on_delete=django.db.models.deletion.PROTECT, to='reservas.carrera'),
        ),
        migrations.AlterField(
            model_name='perfilestudiante',
            name='id_usuario',
            field=models.OneToOneField(db_column='id_usuario', on_delete=django.db.models.deletion.CASCADE, to='reservas.usuario'),
        ),
        migrations.AlterField(
            model_name='reserva',
            name='id_horario',
            field=models.ForeignKey(db_column='id_horario', on_delete=django.db.models.deletion.PROTECT, to='reservas.horariodisponible'),
        ),
        migrations.AlterField(
            model_name='reserva',
            name='id_usuario',
            field=models.ForeignKey(db_column='id_usuario', on_delete=django.db.models.deletion.PROTECT, to='reservas.usuario'),
        ),
        migrations.AlterField(
            model_name='reservadetalle',
            name='id_activo',
            field=models.ForeignKey(db_column='id_activo', on_delete=django.db.models.deletion.PROTECT, to='reservas.activolaboratorio'),
        ),
        migrations.AlterField(
            model_name='reservadetalle',
            name='id_reserva',
            field=models.ForeignKey(db_column='id_reserva', on_delete=django.db.models.deletion.CASCADE, to='reservas.reserva'),
        ),
        migrations.AlterField(
            model_name='tipoactivo',
            name='id_categoria',
            field=models.ForeignKey(db_column='id_categoria', on_delete=django.db.models.deletion.PROTECT, to='reservas.categoriaactivo'),
        ),
        migrations.AlterField(
            model_name='usuario',
            name='id_rol',
            field=models.ForeignKey(db_column='id_rol', on_delete=django.db.models.deletion.PROTECT, to='reservas.rol'),
        ),
        migrations.AlterField(
            model_name='historialmantenimiento',
            name='id_activo',
            field=models.ForeignKey(db_column='id_activo', on_delete=django.db.models.deletion.PROTECT, to='reservas.activolaboratorio'),
        ),
        migrations.AlterField(
            model_name='historialmantenimiento',
            name='id_incidencia',
            field=models.ForeignKey(blank=True, db_column='id_incidencia', null=True, on_delete=django.db.models.deletion.SET_NULL, to='reservas.incidencia'),
        ),
        migrations.AlterField(
            model_name='historialmantenimiento',
            name='registrado_por',
            field=models.ForeignKey(db_column='registrado_por', on_delete=django.db.models.deletion.PROTECT, to='reservas.usuario'),
        ),
        migrations.AlterField(
            model_name='historialreserva',
            name='reserva',
            field=models.ForeignKey(db_column='id_reserva', on_delete=django.db.models.deletion.CASCADE, to='reservas.reserva'),
        ),
        migrations.AlterField(
            model_name='historialreserva',
            name='usuario_cambio',
            field=models.ForeignKey(db_column='usuario_cambio', null=True, on_delete=django.db.models.deletion.SET_NULL, to='reservas.usuario'),
        ),
        migrations.AddIndex(
            model_name='activolaboratorio',
            index=models.Index(fields=['id_laboratorio', 'estado'], name='activo_lab_estado_idx'),
        ),
    ]
