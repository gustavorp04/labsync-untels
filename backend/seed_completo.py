import os
import django
from datetime import datetime, timedelta
from django.utils import timezone

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from reservas.models import Facultad, TipoLaboratorio, Laboratorio, HorarioDisponible, Usuario, Rol, PerfilDocente, PerfilEstudiante, Carrera

def seed_all():
    print("🚀 Iniciando Gran Población de Datos LabSync UNTELS...")

    # 1. ROLES (1-4)
    roles = {
        1: 'estudiante',
        2: 'docente',
        3: 'admin_lab',
        4: 'jefatura'
    }
    for r_id, r_nom in roles.items():
        Rol.objects.get_or_create(id_rol=r_id, defaults={'nombre': r_nom})

    # 2. CARRERAS
    carreras_data = {
        1: 'Ingeniería de Sistemas',
        2: 'Ingeniería Ambiental',
        3: 'Ingeniería Electrónica'
    }
    carreras = {}
    for c_id, c_nom in carreras_data.items():
        carrera, _ = Carrera.objects.get_or_create(id_carrera=c_id, defaults={'nombre': c_nom})
        carreras[c_id] = carrera

    # 3. USUARIO DE PRUEBA AUTORIZADO (Gustavo)
    u_gustavo, created = Usuario.objects.get_or_create(
        email='gustavorpd04@gmail.com',
        defaults={
            'nombre': 'Gustavo Usuario VIP',
            'codigo_universitario': 'GUS2026',
            'password': 'AdminLab_2026',
            'id_rol': Rol.objects.get(id_rol=3)
        }
    )
    if created: print("✅ Usuario Gustavo creado.")

    # 4. USUARIOS - JEFATURA Y ADMIN
    # Jefatura: Jefatura_2026
    Usuario.objects.get_or_create(
        codigo_universitario='JEF0001',
        defaults={
            'nombre': 'Roberto Mendoza Paredes',
            'email': 'r.mendoza@untels.edu.pe',
            'password': 'Jefatura_2026',
            'id_rol': Rol.objects.get(id_rol=4)
        }
    )

    # Admin: AdminLab_2026
    Usuario.objects.get_or_create(
        codigo_universitario='ADM0001',
        defaults={
            'nombre': 'Carmen Villanueva Torres',
            'email': 'c.villanueva@untels.edu.pe',
            'password': 'AdminLab_2026',
            'id_rol': Rol.objects.get(id_rol=3)
        }
    )

    # 5. DOCENTES (9 total - Clave: DocSist_2026, DocAmb_2026, DocElec_2026)
    docentes_info = [
        ('D0001', 'Luis Alberto Quispe Flores', 'l.quispe@untels.edu.pe', 1),
        ('D0002', 'Ana María Castillo Ramos', 'a.castillo@untels.edu.pe', 1),
        ('D0003', 'Jorge Enrique Pacheco Díaz', 'j.pacheco@untels.edu.pe', 1),
        ('D0004', 'Patricia Solano Huanca', 'p.solano@untels.edu.pe', 2),
        ('D0005', 'Miguel Ángel Zevallos Cruz', 'm.zevallos@untels.edu.pe', 2),
        ('D0006', 'Rosa Elena Puma Condori', 'r.puma@untels.edu.pe', 2),
        ('D0007', 'Carlos Humberto Rivas Salas', 'c.rivas@untels.edu.pe', 3),
        ('D0008', 'Susana Beatriz Chávez Lara', 's.chavez@untels.edu.pe', 3),
        ('D0009', 'Fernando José Mamani Apaza', 'f.mamani@untels.edu.pe', 3),
    ]
    
    passwords_doc = {1: 'DocSist_2026', 2: 'DocAmb_2026', 3: 'DocElec_2026'}

    for cod, nom, mail, car_id in docentes_info:
        user, created = Usuario.objects.get_or_create(
            codigo_universitario=cod,
            defaults={
                'nombre': nom,
                'email': mail,
                'password': passwords_doc[car_id],
                'id_rol': Rol.objects.get(id_rol=2)
            }
        )
        PerfilDocente.objects.get_or_create(id_usuario=user, defaults={'departamento': carreras_data[car_id]})

    # 6. ESTUDIANTES (75 total - Clave: EstSist_2026, etc.)
    # (Resumido para el script, pero cubriendo la lógica del SQL)
    est_especial = [
        ('2223010267', 'Fiorella Portalanza Hurtado', '2223010267@untels.edu.pe', 1, 8),
    ]
    
    passwords_est = {1: 'EstSist_2026', 2: 'EstAmb_2026', 3: 'EstElec_2026'}

    for cod, nom, mail, car_id, ciclo in est_especial:
        user, created = Usuario.objects.get_or_create(
            codigo_universitario=cod,
            defaults={
                'nombre': nom,
                'email': mail,
                'password': passwords_est[car_id],
                'id_rol': Rol.objects.get(id_rol=1)
            }
        )
        PerfilEstudiante.objects.get_or_create(id_usuario=user, defaults={'id_carrera': carreras[car_id], 'ciclo': ciclo})

    # 7. LABORATORIOS Y HORARIOS
    fac, _ = Facultad.objects.get_or_create(nombre="Facultad de Ingeniería")
    tipo_comp, _ = TipoLaboratorio.objects.get_or_create(nombre="Cómputo")
    tipo_elec, _ = TipoLaboratorio.objects.get_or_create(nombre="Electrónica")

    labs_data = [
        ('C3-3', 30, tipo_comp),
        ('C2-1', 25, tipo_comp),
        ('L-E1', 20, tipo_elec),
    ]
    
    print("⏲️ Generando horarios para la semana...")
    for l_nom, cap, t in labs_data:
        lab, _ = Laboratorio.objects.get_or_create(
            nombre=l_nom,
            defaults={'capacidad': cap, 'id_facultad': fac, 'id_tipo': t, 'estado': 'Activo'}
        )
        
        # Generar 4 turnos por día para los próximos 7 días
        for d in range(1, 8):
            fecha = timezone.now().date() + timedelta(days=d)
            for h in [8, 10, 14, 16]:
                HorarioDisponible.objects.get_or_create(
                    id_laboratorio=lab,
                    fecha=fecha,
                    hora_inicio=f"{h:02d}:00:00",
                    hora_fin=f"{h+2:02d}:00:00",
                    defaults={'capacidad_total': cap, 'capacidad_ocupada': 0, 'estado': 'Disponible'}
                )

    print("✅ ¡Población masiva completada! Todo listo para la otra PC.")

if __name__ == '__main__':
    seed_all()
