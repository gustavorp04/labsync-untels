import os
import django
import random
from datetime import datetime, timedelta
from django.db import connection, transaction

# Configuración de Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from reservas.models import (
    Laboratorio, TipoLaboratorio, ActivoLaboratorio, TipoActivo,
    HorarioDisponible, Facultad, Carrera, Usuario, Rol, CategoriaActivo
)

def ejecutar_sql_archivo(ruta_relativa):
    """Lee y ejecuta un archivo SQL completo en la base de datos."""
    base_dir = os.path.dirname(os.path.abspath(__file__))
    ruta_archivo = os.path.join(base_dir, 'scripts sql', ruta_relativa)
    
    if not os.path.exists(ruta_archivo):
        print(f"Warning: File not found: {ruta_archivo}")
        return False

    print(f"Reading: {ruta_relativa}...")
    try:
        with open(ruta_archivo, 'r', encoding='utf-8') as f:
            sql = f.read()
            
        with connection.cursor() as cursor:
            cursor.execute(sql)
        print(f"OK: {ruta_relativa} loaded successfully.")
        return True
    except Exception as e:
        print(f"Error executing {ruta_relativa}: {str(e)}")
        return False

def limpiar_tablas_dinamicas():
    """Limpia tablas que se regenerarán dinámicamente."""
    print("Cleaning dynamic tables...")
    with connection.cursor() as cursor:
        cursor.execute("TRUNCATE TABLE horario_disponible RESTART IDENTITY CASCADE;")
        cursor.execute("TRUNCATE TABLE activo_laboratorio RESTART IDENTITY CASCADE;")

def generar_activos_inteligentes():
    print("Generating assets for laboratories...")
    labs = Laboratorio.objects.all()
    
    try:
        cpu_type = TipoActivo.objects.get(nombre='CPU')
        monitor_type = TipoActivo.objects.get(nombre='Monitor')
        mesa_type = TipoActivo.objects.get(nombre='Mesa')
    except TipoActivo.DoesNotExist:
        print("Error: Base asset types not found. Ensure schema is loaded.")
        return

    for lab in labs:
        if lab.id_tipo.nombre == 'Cómputo':
            cantidad = lab.aforo_maximo
            for i in range(1, cantidad + 1):
                num = f"{lab.codigo_patrimonio}-{i:02d}"
                # CPU
                ActivoLaboratorio.objects.create(
                    id_laboratorio=lab,
                    id_tipo_activo=cpu_type,
                    num_serie=f"SER-CPU-{num}",
                    codigo_patrimonio=f"PAT-CPU-{num}",
                    estado='Operativo',
                    updated_at=datetime.now()
                )
                # Monitor
                ActivoLaboratorio.objects.create(
                    id_laboratorio=lab,
                    id_tipo_activo=monitor_type,
                    num_serie=f"SER-MON-{num}",
                    codigo_patrimonio=f"PAT-MON-{num}",
                    estado='Operativo',
                    updated_at=datetime.now()
                )
        else:
            cantidad_mesas = lab.aforo_maximo // 2
            for i in range(1, cantidad_mesas + 1):
                num = f"{lab.codigo_patrimonio}-M{i:02d}"
                ActivoLaboratorio.objects.create(
                    id_laboratorio=lab,
                    id_tipo_activo=mesa_type,
                    num_serie=f"SER-MES-{num}",
                    codigo_patrimonio=f"PAT-MES-{num}",
                    estado='Operativo',
                    updated_at=datetime.now()
                )
    print(f"Inventory generated for {labs.count()} labs.")

def generar_horarios_maestros():
    print("Generating official university schedules...")
    labs = Laboratorio.objects.all()
    
    bloques = [
        ('08:00', '09:40'), ('09:40', '11:20'), ('11:20', '13:00'),
        ('13:50', '15:30'), ('15:30', '17:10'), ('17:10', '18:50'),
        ('18:50', '20:30'), ('20:30', '22:10'),
    ]

    hoy = datetime.now().date()
    lunes = hoy - timedelta(days=hoy.weekday())
    
    # MAPEADO EXHAUSTIVO DE LAS 21 IMÁGENES (0=Lun, 1=Mar, 2=Mie, 3=Jue, 4=Vie, 5=Sab)
    bloqueados = {
        'A1-1': { # Sistemas 01
            0: ['08:00', '09:40', '13:50', '15:30', '18:50', '20:30'],
            1: ['08:00', '09:40', '13:50', '15:30', '18:50'],
            2: ['08:00', '09:40', '13:50', '15:30', '18:50', '20:30'],
            3: ['08:00', '09:40', '13:50', '15:30', '18:50', '20:30'],
            4: ['09:40', '13:50', '15:30', '18:50', '20:30'],
            5: ['08:00', '09:40', '15:30', '17:10']
        },
        'A2-3': { # Sistemas 02
            0: ['08:00', '09:40', '13:50', '15:30', '18:00'],
            1: ['08:00', '09:40', '13:50', '16:20', '18:00'],
            2: ['08:00', '09:40', '15:30', '18:50', '20:30'],
            3: ['08:00', '09:40', '13:50', '15:30', '18:00'],
            4: ['08:00', '09:40', '13:50', '15:30', '18:50', '20:30'],
            5: ['08:00', '09:40', '13:50', '15:30']
        },
        'C3-3': { # Georef
            0: ['08:00', '09:40', '11:20', '18:50'],
            1: ['13:50', '15:30'],
            3: ['13:50', '15:30', '18:00', '18:50'],
            4: ['13:50', '15:30', '17:10', '18:50'],
            5: ['11:20', '17:10', '18:50']
        },
        'FIS-G1': { # Física
            0: ['08:00', '09:40', '14:40', '17:10'],
            1: ['08:00', '10:30', '14:40', '17:10'],
            2: ['10:30'],
            3: ['08:00', '13:50'],
            4: ['08:50', '11:20', '13:50']
        },
        'C2-3': { # Química Ambiental
            0: ['09:40', '11:20'],
            1: ['13:50', '15:30'],
            2: ['10:30', '13:50', '15:30'],
            3: ['10:30']
        },
        'C2-2A': { # Sistemas 04
            0: ['08:00', '10:30', '13:50', '15:30', '18:50', '20:30'],
            1: ['08:00', '09:40', '13:50', '15:30', '18:50', '20:30'],
            2: ['08:00', '10:30', '13:50', '15:30', '18:50', '20:30'],
            3: ['13:50', '15:30', '18:00', '19:40'],
            4: ['08:00', '10:30', '13:50', '15:30', '18:00', '19:40']
        },
        'B3-9': { # Mecánica
            0: ['08:00', '09:40', '11:20', '18:00', '19:40'],
            1: ['08:00', '10:30', '13:50', '15:30', '17:10'],
            2: ['08:00', '10:30', '14:40', '16:20', '18:00', '19:40'],
            3: ['08:00', '10:30', '13:50', '15:30', '18:00'],
            4: ['08:00', '13:50', '18:00', '19:40'],
            5: ['13:50', '18:50']
        }
    }

    count = 0
    for i in range(6):
        fecha = lunes + timedelta(days=i)
        for lab in labs:
            for inicio, fin in bloques:
                estado = 'Disponible'
                cap_ocupada = 0
                if lab.codigo_patrimonio in bloqueados and i in bloqueados[lab.codigo_patrimonio]:
                    if inicio in bloqueados[lab.codigo_patrimonio][i]:
                        estado = 'Bloqueado'
                        cap_ocupada = lab.aforo_maximo

                HorarioDisponible.objects.create(
                    id_laboratorio=lab, fecha=fecha, hora_inicio=inicio, hora_fin=fin,
                    capacidad_total=lab.aforo_maximo, capacidad_ocupada=cap_ocupada, estado=estado
                )
                count += 1
    print(f"OK: {count} slots created.")

def main():
    print("=== MASTER SEED: LABSYNC UNTELS ===")
    ejecutar_sql_archivo('labsync_schema.sql')
    ejecutar_sql_archivo('seed_demo.sql')
    ejecutar_sql_archivo('seed_laboratorios.sql')
    
    limpiar_tablas_dinamicas()
    
    with transaction.atomic():
        generar_activos_inteligentes()
        generar_horarios_maestros()
    
    print("\n=== SYSTEM READY: ADMIN CREDENTIALS ===")
    print("User: ADM0001 | Pass: AdminLab_2026")

if __name__ == '__main__':
    main()
