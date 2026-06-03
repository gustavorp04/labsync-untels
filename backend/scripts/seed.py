import os
import django
import csv
from datetime import datetime, timedelta
from django.db import connection, transaction

# 1. Configuración de Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from reservas.models import (
    Laboratorio, TipoLaboratorio, ActivoLaboratorio, TipoActivo,
    HorarioDisponible
)

def ejecutar_sql_archivo(ruta_relativa):
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
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
        print(f"ERROR loading {ruta_relativa}: {str(e)}")
        # Si es un error de que ya existe, no importa, pero si es otro, queremos saberlo.
        if "already exists" in str(e).lower():
            return True
        return False

def limpiar_tablas_dinamicas():
    print("Cleaning dynamic tables...")
    with connection.cursor() as cursor:
        cursor.execute("TRUNCATE TABLE horario_disponible RESTART IDENTITY CASCADE;")
        cursor.execute("TRUNCATE TABLE activo_laboratorio RESTART IDENTITY CASCADE;")

def generar_activos_inteligentes():
    print("Generating dynamic assets for laboratories...")
    labs = Laboratorio.objects.all()
    try:
        cpu_type = TipoActivo.objects.get(nombre='CPU')
        monitor_type = TipoActivo.objects.get(nombre='Monitor')
        teclado_type = TipoActivo.objects.get(nombre='Teclado')
        mouse_type = TipoActivo.objects.get(nombre='Mouse')
        mesa_type = TipoActivo.objects.get(nombre='Mesa')
    except TipoActivo.DoesNotExist:
        print("Error: Base asset types not found.")
        return

    for lab in labs:
        if lab.id_tipo.nombre == 'Cómputo':
            cantidad = lab.aforo_maximo
            for i in range(1, cantidad + 1):
                num = f"{lab.codigo_patrimonio}-{i:02d}"
                ActivoLaboratorio.objects.create(
                    id_laboratorio=lab, id_tipo_activo=cpu_type,
                    num_serie=f"SER-CPU-{num}", codigo_patrimonio=f"PAT-CPU-{num}", 
                    estado='Operativo', updated_at=datetime.now()
                )
                ActivoLaboratorio.objects.create(
                    id_laboratorio=lab, id_tipo_activo=monitor_type,
                    num_serie=f"SER-MON-{num}", codigo_patrimonio=f"PAT-MON-{num}", 
                    estado='Operativo', updated_at=datetime.now()
                )
                ActivoLaboratorio.objects.create(
                    id_laboratorio=lab, id_tipo_activo=teclado_type,
                    num_serie=f"SER-TEC-{num}", codigo_patrimonio=f"PAT-TEC-{num}", 
                    estado='Operativo', updated_at=datetime.now()
                )
                ActivoLaboratorio.objects.create(
                    id_laboratorio=lab, id_tipo_activo=mouse_type,
                    num_serie=f"SER-MOU-{num}", codigo_patrimonio=f"PAT-MOU-{num}", 
                    estado='Operativo', updated_at=datetime.now()
                )
        else:
            cantidad_mesas = lab.aforo_maximo // 2
            for i in range(1, cantidad_mesas + 1):
                num = f"{lab.codigo_patrimonio}-M{i:02d}"
                ActivoLaboratorio.objects.create(
                    id_laboratorio=lab, id_tipo_activo=mesa_type,
                    num_serie=f"SER-MES-{num}", codigo_patrimonio=f"PAT-MES-{num}", 
                    estado='Operativo', updated_at=datetime.now()
                )
    print(f"Inventory generated for {labs.count()} labs.")

def generar_horarios_maestros():
    print("Processing schedules from real CSV data (Standard Library Version)...")
    
    bloques = [
        ('08:00', '09:40'), ('09:40', '11:20'), ('11:20', '13:00'),
        ('13:00', '13:50'), ('13:50', '15:30'), ('15:30', '17:10'), 
        ('17:10', '18:50'), ('18:50', '20:30'), ('20:30', '22:10'),
    ]

    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    ruta_csv = os.path.join(base_dir, 'horarios.csv')
    bloqueados = {}
    
    dias_map = {
        'lunes': 0, 'martes': 1, 'miercoles': 2, 'miércoles': 2,
        'jueves': 3, 'viernes': 4, 'sabado': 5, 'sábado': 5
    }

    try:
        if not os.path.exists(ruta_csv):
            print(f"Error: {ruta_csv} not found.")
            return

        with open(ruta_csv, mode='r', encoding='utf-8', errors='replace') as f:
            # Saltamos la primera línea si es necesario (skiprows=1)
            f.readline()
            reader = csv.reader(f, delimiter=';')
            
            for row in reader:
                if len(row) < 7: continue
                
                # Columnas según el mapeo previo:
                # 0: Laboratorio, 3: Día, 4: Hora Inicio, 6: Estado
                lab_cod = row[0].strip()
                dia_str = row[3].strip().lower()
                h_inicio = row[4].strip()
                estado_str = row[6].strip().lower()
                
                if estado_str == 'bloqueado':
                    if len(h_inicio) == 4 and h_inicio.find(':') == 1:
                        h_inicio = '0' + h_inicio
                    
                    dia_num = dias_map.get(dia_str, -1)
                    
                    if lab_cod not in bloqueados:
                        bloqueados[lab_cod] = {}
                    if dia_num not in bloqueados[lab_cod]:
                        bloqueados[lab_cod][dia_num] = []
                    
                    bloqueados[lab_cod][dia_num].append(h_inicio)
                    
        print("CSV schedule data mapped perfectly (CSV module).")
    except Exception as e:
        print(f"Error processing CSV: {e}")
        return

    hoy = datetime.now().date()
    count = 0
    for i in range(10):
        fecha = hoy + timedelta(days=i)
        dia_sem = fecha.weekday()
        if dia_sem == 6: continue

        for lab in Laboratorio.objects.all():
            for inicio, fin in bloques:
                estado = 'Disponible'
                cap_ocupada = 0
                
                if lab.codigo_patrimonio in bloqueados and dia_sem in bloqueados[lab.codigo_patrimonio]:
                    if inicio in bloqueados[lab.codigo_patrimonio][dia_sem]:
                        estado = 'Bloqueado'
                        cap_ocupada = lab.aforo_maximo

                HorarioDisponible.objects.create(
                    id_laboratorio=lab, fecha=fecha, hora_inicio=inicio, hora_fin=fin,
                    capacidad_total=lab.aforo_maximo, capacidad_ocupada=cap_ocupada, estado=estado
                )
                count += 1
    print(f"OK: {count} real slots synchronized.")

def main():
    print("=== MASTER SEED: LABSYNC UNTELS ===")
    ejecutar_sql_archivo('labsync_schema.sql')
    ejecutar_sql_archivo('seed_demo.sql')
    ejecutar_sql_archivo('seed_laboratorios.sql')
    
    limpiar_tablas_dinamicas()
    
    with transaction.atomic():
        generar_horarios_maestros()
        generar_activos_inteligentes()
    
    print("\n=== SYSTEM READY: ADMIN CREDENTIALS ===")
    print("User: ADM0001 | Pass: AdminLab_2026")

if __name__ == '__main__':
    main()