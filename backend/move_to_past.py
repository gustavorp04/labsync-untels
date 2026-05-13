import os
import django
from datetime import datetime, time

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from reservas.models import HorarioDisponible, Reserva

def move_to_past():
    try:
        # Horario de la tarde (ID 5 según el log previo: 15:30 - 17:10)
        horario_pasado = HorarioDisponible.objects.get(pk=5)
        
        # Reservas inyectadas (IDs 4, 5, 6)
        reservas = Reserva.objects.filter(id_reserva__in=[4, 5, 6])
        
        for r in reservas:
            r.id_horario = horario_pasado
            r.save()
            
        print(f"Éxito: Reservas 4, 5 y 6 movidas al horario {horario_pasado.hora_inicio} - {horario_pasado.hora_fin} (Ya pasado).")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == '__main__':
    move_to_past()
