import os
import django
from django.db import connection

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

def check_constraints():
    with connection.cursor() as cursor:
        # Verificar tabla reserva
        cursor.execute("""
            SELECT conname, pg_get_constraintdef(c.oid) 
            FROM pg_constraint c 
            JOIN pg_class t ON t.oid = c.conrelid 
            WHERE t.relname = 'horario_disponible' AND c.conname = 'horario_disponible_estado_check'
        """)
        row = cursor.fetchone()
        if row:
            print(f"Constraint Horario: {row[1]}")
        else:
            print("No se encontró la restricción en horario_disponible")

if __name__ == '__main__':
    check_constraints()
