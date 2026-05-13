import os
import django
from datetime import datetime, time, timedelta

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from reservas.models import Laboratorio, HorarioDisponible, Usuario, Reserva, ActivoLaboratorio, ReservaDetalle

def inject_test_data():
    try:
        lab = Laboratorio.objects.filter(codigo_patrimonio='A1-1').first()
        if not lab:
            print("Lab A1-1 not found")
            return

        hoy = datetime.now().date()
        # Crear un horario que incluya la hora actual (23:43)
        h_inicio = time(23, 0)
        h_fin = time(23, 59)
        
        horario, _ = HorarioDisponible.objects.get_or_create(
            id_laboratorio=lab,
            fecha=hoy,
            hora_inicio=h_inicio,
            hora_fin=h_fin,
            defaults={'capacidad_total': lab.aforo_maximo, 'capacidad_ocupada': 3, 'estado': 'Disponible'}
        )

        user = Usuario.objects.filter(id_rol__nombre='estudiante').first()
        if not user:
            print("No student found")
            return

        # Activos para las reservas
        activos = ActivoLaboratorio.objects.filter(id_laboratorio=lab, id_tipo_activo__nombre='CPU')[:3]
        
        # 1. Reserva para marcar como "Asistió" (la dejamos en Programada)
        r1 = Reserva.objects.create(
            id_usuario=user, id_horario=horario, cantidad_alumnos=1,
            acepto_declaracion_jurada=True, estado='Programada',
            created_at=datetime.now(), updated_at=datetime.now()
        )
        ReservaDetalle.objects.create(id_reserva=r1, id_activo=activos[0])

        # 2. Reserva para marcar como "No-Show" (la dejamos en Programada)
        r2 = Reserva.objects.create(
            id_usuario=user, id_horario=horario, cantidad_alumnos=1,
            acepto_declaracion_jurada=True, estado='Programada',
            created_at=datetime.now(), updated_at=datetime.now()
        )
        ReservaDetalle.objects.create(id_reserva=r2, id_activo=activos[1])

        # 3. Reserva que ya está en "Pendiente" (para probar el flujo de quórum)
        r3 = Reserva.objects.create(
            id_usuario=user, id_horario=horario, cantidad_alumnos=1,
            acepto_declaracion_jurada=True, estado='Pendiente',
            created_at=datetime.now(), updated_at=datetime.now()
        )
        ReservaDetalle.objects.create(id_reserva=r3, id_activo=activos[2])

        print(f"Inyectados 3 registros en A1-1 para hoy {hoy} a las 23:00.")
        print(f"IDs: {r1.id_reserva} (Prog), {r2.id_reserva} (Prog), {r3.id_reserva} (Pend)")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == '__main__':
    inject_test_data()
