import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.db import connection

def update_constraint():
    with connection.cursor() as cursor:
        try:
            cursor.execute("ALTER TABLE reserva DROP CONSTRAINT IF EXISTS reserva_estado_check;")
            cursor.execute("ALTER TABLE reserva ADD CONSTRAINT reserva_estado_check CHECK (estado IN ('Programada', 'Cancelada', 'Completada', 'No-Show', 'Pendiente'));")
            print("Restricción actualizada con éxito.")
        except Exception as e:
            print(f"Error actualizando la restricción: {e}")

if __name__ == "__main__":
    update_constraint()
