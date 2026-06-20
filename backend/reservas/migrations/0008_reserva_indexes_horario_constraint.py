from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('reservas', '0007_activolaboratorio_columna_activolaboratorio_fila_and_more'),
    ]

    operations = [
        # Índices en Reserva para filtros frecuentes por estado
        migrations.AddIndex(
            model_name='reserva',
            index=models.Index(fields=['estado'], name='reserva_estado_idx'),
        ),
        migrations.AddIndex(
            model_name='reserva',
            index=models.Index(fields=['id_horario', 'estado'], name='reserva_horario_estado_idx'),
        ),
        # CheckConstraint en HorarioDisponible — estado solo acepta valores válidos
        migrations.AddConstraint(
            model_name='horariodisponible',
            constraint=models.CheckConstraint(
                check=models.Q(estado__in=['Disponible', 'Completo', 'Inhabilitado']),
                name='horario_estado_valido',
            ),
        ),
    ]
