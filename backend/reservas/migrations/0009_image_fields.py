from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('reservas', '0008_reserva_indexes_horario_constraint'),
    ]

    operations = [
        migrations.AddField(
            model_name='incidencia',
            name='imagen',
            field=models.ImageField(blank=True, null=True, upload_to='incidencias/'),
        ),
        migrations.AddField(
            model_name='historialmantenimiento',
            name='imagen',
            field=models.ImageField(blank=True, null=True, upload_to='mantenimiento/'),
        ),
        migrations.AddField(
            model_name='laboratorio',
            name='imagen_inhabilitacion',
            field=models.ImageField(blank=True, null=True, upload_to='inhabilitaciones/'),
        ),
    ]
