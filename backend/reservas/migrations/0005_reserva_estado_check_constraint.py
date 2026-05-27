from django.db import migrations, models


class Migration(migrations.Migration):
    """ID-11: Agrega CHECK constraint a nivel de BD para el campo estado de Reserva."""

    dependencies = [
        ('reservas', '0001_initial'),
    ]

    operations = [
        migrations.AddConstraint(
            model_name='reserva',
            constraint=models.CheckConstraint(
                check=models.Q(
                    estado__in=['Programada', 'Pendiente', 'Cancelada', 'Completada', 'No-show']
                ),
                name='reserva_estado_valido',
            ),
        ),
    ]
