import os
import django
from datetime import datetime, time, timedelta
from django.db import connection, transaction
from django.utils import timezone

# 1. Configuración de Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from reservas.models import (
    Laboratorio, HorarioDisponible, Usuario, Reserva, 
    ActivoLaboratorio, ReservaDetalle, HistorialReserva
)

def fix_schema():
    print("=== FIXING SCHEMA: Creating missing tables ===")
    sql_historial = """
    CREATE TABLE IF NOT EXISTS historial_reserva (
        id_historial     SERIAL       PRIMARY KEY,
        id_reserva       INT          NOT NULL REFERENCES reserva(id_reserva) ON DELETE CASCADE,
        estado_anterior  VARCHAR(20)  NOT NULL,
        estado_nuevo     VARCHAR(20)  NOT NULL,
        fecha_cambio     TIMESTAMP    NOT NULL DEFAULT NOW(),
        usuario_cambio   INT          REFERENCES usuario(id_usuario) ON DELETE SET NULL,
        observacion      TEXT
    );
    """
    sql_penalizacion = """
    CREATE TABLE IF NOT EXISTS penalizacion (
        id_penalizacion  SERIAL     PRIMARY KEY,
        id_usuario       INT        NOT NULL REFERENCES usuario(id_usuario),
        id_reserva       INT        NOT NULL UNIQUE REFERENCES reserva(id_reserva),
        fecha_inicio     TIMESTAMP  NOT NULL DEFAULT NOW(),
        fecha_fin        TIMESTAMP  NOT NULL,
        CONSTRAINT ck_penalizacion_fechas CHECK (fecha_fin > fecha_inicio)
    );
    """
    
    with connection.cursor() as cursor:
        try:
            cursor.execute(sql_historial)
            print("OK: Table historial_reserva verified/created.")
        except Exception as e:
            print(f"Error creating historial_reserva: {e}")
            
        try:
            cursor.execute(sql_penalizacion)
            print("OK: Table penalizacion verified/created.")
        except Exception as e:
            print(f"Error creating penalizacion: {e}")

def inject_5_reservas():
    print("\n=== INJECTING 5 TEST RESERVATIONS FOR TODAY ===")
    try:
        lab = Laboratorio.objects.first()
        if not lab:
            print("Error: No laboratories found.")
            return

        # Buscar o crear 5 horarios para hoy
        hoy = timezone.now().date()
        base_time = datetime.now()
        
        # Estudiante para las reservas
        user = Usuario.objects.filter(id_rol__nombre='estudiante').first()
        if not user:
            # Intentar crear un estudiante de prueba si no existe
            print("No student found, please run seed first.")
            return

        # Activos para las reservas
        activos = ActivoLaboratorio.objects.filter(id_laboratorio=lab, estado='Operativo')[:5]
        if activos.count() < 5:
            print(f"Warning: Only {activos.count()} operative assets found. Using what's available.")

        for i in range(5):
            h_start = (base_time + timedelta(hours=i)).time()
            h_end = (base_time + timedelta(hours=i+1)).time()
            
            horario, _ = HorarioDisponible.objects.get_or_create(
                id_laboratorio=lab,
                fecha=hoy,
                hora_inicio=h_start,
                hora_fin=h_end,
                defaults={
                    'capacidad_total': lab.aforo_maximo, 
                    'capacidad_ocupada': 1, 
                    'estado': 'Disponible'
                }
            )

            reserva = Reserva.objects.create(
                id_usuario=user,
                id_horario=horario,
                cantidad_alumnos=1,
                acepto_declaracion_jurada=True,
                estado='Programada',
                created_at=timezone.now(),
                updated_at=timezone.now()
            )
            
            if i < activos.count():
                ReservaDetalle.objects.create(id_reserva=reserva, id_activo=activos[i])
            
            # Intentar crear historial ahora que la tabla debería existir
            try:
                HistorialReserva.objects.create(
                    reserva=reserva,
                    estado_anterior='N/A',
                    estado_nuevo='Programada',
                    usuario_cambio=user,
                    observacion="Inyección de prueba PBI-06."
                )
            except:
                pass

            print(f"Inyectada Reserva ID: {reserva.id_reserva} - Horario: {h_start} - {h_end}")

        print("\nSUCCESS: 5 reservations injected for today.")
    except Exception as e:
        print(f"Error during injection: {e}")
        import traceback
        traceback.print_exc()

def main():
    fix_schema()
    inject_5_reservas()

if __name__ == '__main__':
    main()
