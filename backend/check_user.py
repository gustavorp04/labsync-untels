import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'labsync_untels.settings')
django.setup()

from reservas.models import Usuario, PerfilEstudiante

def check_user(user_id):
    try:
        user = Usuario.objects.get(pk=user_id)
        print(f"USUARIO: {user.nombre} (ID: {user.id_usuario})")
        print(f"CODIGO: {user.codigo_universitario}")
        
        perfil = PerfilEstudiante.objects.filter(id_usuario=user).first()
        if perfil:
            print(f"CARRERA: {perfil.id_carrera.nombre}")
            print(f"CICLO: {perfil.ciclo}")
        else:
            print("ERROR: El usuario NO tiene perfil en la tabla perfil_estudiante.")
    except Usuario.DoesNotExist:
        print(f"ERROR: El usuario con ID {user_id} no existe.")

if __name__ == "__main__":
    check_user(12)
