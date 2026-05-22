# Generated manually

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('reservas', '0003_alter_activolaboratorio_options'),
    ]

    operations = [
        migrations.AlterModelOptions(
            name='asistencia',
            options={'managed': True},
        ),
        migrations.AlterModelOptions(
            name='carrera',
            options={'managed': True},
        ),
        migrations.AlterModelOptions(
            name='categoriaactivo',
            options={'managed': True},
        ),
        migrations.AlterModelOptions(
            name='configuracionsistema',
            options={'managed': True},
        ),
        migrations.AlterModelOptions(
            name='facultad',
            options={'managed': True},
        ),
        migrations.AlterModelOptions(
            name='historialmantenimiento',
            options={'managed': True},
        ),
        migrations.AlterModelOptions(
            name='historialreserva',
            options={'managed': True},
        ),
        migrations.AlterModelOptions(
            name='horariodisponible',
            options={'managed': True},
        ),
        migrations.AlterModelOptions(
            name='incidencia',
            options={'managed': True},
        ),
        migrations.AlterModelOptions(
            name='laboratorio',
            options={'managed': True},
        ),
        migrations.AlterModelOptions(
            name='passwordreset',
            options={'managed': True},
        ),
        migrations.AlterModelOptions(
            name='penalizacion',
            options={'managed': True},
        ),
        migrations.AlterModelOptions(
            name='perfildocente',
            options={'managed': True},
        ),
        migrations.AlterModelOptions(
            name='perfilestudiante',
            options={'managed': True},
        ),
        migrations.AlterModelOptions(
            name='reserva',
            options={'managed': True},
        ),
        migrations.AlterModelOptions(
            name='reservadetalle',
            options={'managed': True},
        ),
        migrations.AlterModelOptions(
            name='rol',
            options={'managed': True},
        ),
        migrations.AlterModelOptions(
            name='tipoactivo',
            options={'managed': True},
        ),
        migrations.AlterModelOptions(
            name='tipolaboratorio',
            options={'managed': True},
        ),
        migrations.AlterModelOptions(
            name='usuario',
            options={'managed': True},
        ),
        migrations.CreateModel(
            name='SesionUsuario',
            fields=[
                ('id_sesion', models.AutoField(primary_key=True, serialize=False)),
                ('token', models.CharField(max_length=255, unique=True)),
                ('fecha_creacion', models.DateTimeField(auto_now_add=True)),
                ('fecha_expiracion', models.DateTimeField()),
                ('id_usuario', models.ForeignKey(db_column='id_usuario', on_delete=django.db.models.deletion.CASCADE, to='reservas.usuario')),
            ],
            options={
                'db_table': 'sesion_usuario',
                'managed': True,
            },
        ),
    ]
