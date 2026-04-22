import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from reservas.models import Usuario, Rol
from django.contrib.auth.hashers import make_password

def run():
    print("🚀 Iniciando carga de datos de prueba...")
    
    # 1. Crear Roles si no existen
    estudiante_rol, _ = Rol.objects.get_or_create(nombre='Estudiante')
    docente_rol, _ = Rol.objects.get_or_create(nombre='Docente')
    print("✅ Roles configurados.")

    # 2. Usuarios a crear
    usuarios_data = [
        {
            'codigo': '2024001',
            'nombre': 'Gustavo Principal',
            'email': 'gustavorpd4@gmail.com',
            'rol': estudiante_rol
        },
        {
            'codigo': '2024002',
            'nombre': 'Usuario Prueba 2',
            'email': 'docente_test@gmail.com',
            'rol': docente_rol
        },
        {
            'codigo': '2024003',
            'nombre': 'Usuario Prueba 3',
            'email': 'estudiante_demo@gmail.com',
            'rol': estudiante_rol
        }
    ]

    password_comun = make_password('Admin123!')

    for data in usuarios_data:
        user, created = Usuario.objects.get_or_create(
            codigo_universitario=data['codigo'],
            defaults={
                'nombre': data['nombre'],
                'email': data['email'],
                'id_rol': data['rol'],
                'password_hash': password_comun
            }
        )
        if created:
            print(f"✅ Usuario creado: {data['codigo']} ({data['nombre']})")
        else:
            print(f"⚠️ El usuario {data['codigo']} ya existía.")

    print("\n✨ TODO LISTO PARA EL LOGIN:")
    print("---------------------------------")
    print("Usuario: 2024001 | Password: Admin123! | Email: gustavorpd4@gmail.com")
    print("---------------------------------")

if __name__ == '__main__':
    run()
