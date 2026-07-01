from django.db import migrations


def fix_estado_bloqueado(apps, schema_editor):
    HorarioDisponible = apps.get_model('reservas', 'HorarioDisponible')
    HorarioDisponible.objects.filter(estado='Bloqueado').update(
        estado='Inhabilitado'
    )


class Migration(migrations.Migration):
    dependencies = [
        ('reservas', '0010_fix_on_delete_and_add_index'),
    ]
    operations = [
        migrations.RunPython(fix_estado_bloqueado, migrations.RunPython.noop),
    ]
