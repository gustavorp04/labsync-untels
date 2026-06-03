import os
import sys
import django
import threading

sys.path.append('d:\\Carpetas Personales\\GUSTAVO\\UNTELS\\CICLO VIII\\reserva_aulas\\backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from reservas.models import HorarioDisponible, Reserva, Usuario, ActivoLaboratorio
from reservas.services.reserva_service import crear_reserva_estudiante
from django.db import connection

# Cleanup existing reservations
Reserva.objects.all().delete()

horario = HorarioDisponible.objects.first()
activos = ActivoLaboratorio.objects.all()[:10]
usuarios = Usuario.objects.filter(id_rol__nombre='estudiante')[:10]

print(f"Horario capacidad_total: {horario.capacidad_total}")
print(f"Horario capacidad_ocupada: {horario.capacidad_ocupada}")

# We will try to reserve the last space.
# Let's artificially set the capacity of this horario to 1, or let's create 2 reservations concurrently for the same activo.
def make_reservation(user, activo):
    try:
        res, err = crear_reserva_estudiante(user, horario.id_horario, activo.id_activo, True)
        if err:
            print(f"Error for {user.nombre}: {err}")
        else:
            print(f"Success for {user.nombre}")
    except Exception as e:
        print(f"Exception for {user.nombre}: {e}")
    finally:
        connection.close()

threads = []
for i in range(2):
    t = threading.Thread(target=make_reservation, args=(usuarios[i], activos[0]))
    threads.append(t)

for t in threads:
    t.start()

for t in threads:
    t.join()

print("Final status:")
print(f"Reservas for this activo: {Reserva.objects.count()}")
