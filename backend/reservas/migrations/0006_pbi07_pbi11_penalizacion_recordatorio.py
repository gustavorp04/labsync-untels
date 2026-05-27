"""
Migración PBI-07 + PBI-11:

  - Penalizacion: agrega `motivo` y `notificado_expiracion`.
  - RecordatorioEnviado: nueva tabla para evitar recordatorios duplicados.
"""
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('reservas', '0005_reserva_estado_check_constraint'),
    ]

    operations = [
        # ── PBI-07: campos adicionales en Penalizacion ──────────────────────
        migrations.AddField(
            model_name='penalizacion',
            name='motivo',
            field=models.CharField(blank=True, max_length=200, null=True),
        ),
        migrations.AddField(
            model_name='penalizacion',
            name='notificado_expiracion',
            field=models.BooleanField(default=False),
        ),

        # ── PBI-11: tabla RecordatorioEnviado ────────────────────────────────
        migrations.CreateModel(
            name='RecordatorioEnviado',
            fields=[
                ('id_recordatorio', models.AutoField(primary_key=True, serialize=False)),
                ('id_reserva', models.ForeignKey(
                    db_column='id_reserva',
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='recordatorios',
                    to='reservas.reserva',
                )),
                ('tipo', models.CharField(
                    choices=[('24h', '24 horas antes')],
                    default='24h',
                    max_length=10,
                )),
                ('fecha_envio', models.DateTimeField(auto_now_add=True)),
                ('exitoso', models.BooleanField(default=True)),
                ('detalle_error', models.TextField(blank=True, null=True)),
            ],
            options={
                'db_table': 'recordatorio_enviado',
                'managed': True,
            },
        ),
        migrations.AlterUniqueTogether(
            name='recordatorioenviado',
            unique_together={('id_reserva', 'tipo')},
        ),
    ]
