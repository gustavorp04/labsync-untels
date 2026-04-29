import os
import django
from django.db import connection

# Configuración de Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

def ejecutar_sql_archivo(ruta_relativa):
    """Lee y ejecuta un archivo SQL completo en la base de datos."""
    # Buscar el archivo en la carpeta 'scripts sql' que está en la raíz
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    ruta_archivo = os.path.join(base_dir, 'scripts sql', ruta_relativa)
    
    if not os.path.exists(ruta_archivo):
        print(f"⚠️  Archivo no encontrado: {ruta_archivo}")
        return False

    print(f"📖 Ejecutando: {ruta_relativa}...")
    try:
        with open(ruta_archivo, 'r', encoding='utf-8') as f:
            sql = f.read()
            
        with connection.cursor() as cursor:
            cursor.execute(sql)
        print(f"✅ {ruta_relativa} cargado con éxito.")
        return True
    except Exception as e:
        print(f"❌ Error al ejecutar {ruta_relativa}: {str(e)}")
        return False

def limpiar_tablas():
    """Limpia las tablas principales para evitar conflictos."""
    print("🧹 Limpiando tablas previas...")
    tablas = [
        "horario_disponible", "reserva", "asistencia", "incidencia", 
        "laboratorio", "tipo_laboratorio", "usuario", "perfil_docente", 
        "perfil_estudiante", "rol", "carrera", "facultad"
    ]
    with connection.cursor() as cursor:
        for tabla in tablas:
            cursor.execute(f"DELETE FROM {tabla} CASCADE;")
    print("✨ Base de Datos limpia.")

def seed_maestro():
    print("🚀 === INICIANDO CARGA MAESTRA LABSYNC UNTELS ===")
    
    # 1. Limpiar todo
    limpiar_tablas()

    # 2. Cargar Datos Semilla en orden de dependencia
    # Nota: El esquema ya debe existir por el comando 'migrate'
    
    # Usuarios, Roles, Facultades y Carreras (seed_demo ya trae el esquema de roles y facultades)
    ejecutar_sql_archivo('seed_demo.sql')
    
    # Tipos de laboratorio y los 17 laboratorios oficiales
    ejecutar_sql_archivo('seed_laboratorios.sql')
    
    # Horarios de la semana oficial (Mayo 2026)
    ejecutar_sql_archivo('seed_horarios_semana.sql')

    print("\n🏁 === PROCESO COMPLETADO CON ÉXITO ===")
    print("💡 Ahora puedes iniciar sesión con:")
    print("   - Admin: ADM0001 / AdminLab_2026")
    print("   - Docente: D0001 / DocSist_2026")

if __name__ == '__main__':
    seed_maestro()
