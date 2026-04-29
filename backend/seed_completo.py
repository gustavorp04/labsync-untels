import os
import django
from django.db import connection

# Configuración de Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

def ejecutar_sql_archivo(ruta_relativa):
    """Lee y ejecuta un archivo SQL completo en la base de datos."""
    # En Docker, la carpeta 'scripts sql' está en /scripts sql
    # En local, está en ../scripts sql
    if os.path.exists('/scripts sql'):
        base_dir = '/'
    else:
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
    """Limpia solo las tablas de datos dinámicos, manteniendo Roles y Carreras."""
    print("🧹 Limpiando tablas de datos...")
    # Solo limpiamos lo que el SEED va a volver a llenar
    # NO limpiamos 'rol', 'facultad', 'carrera' ni 'tipo_laboratorio' 
    # porque ya vienen en el esquema oficial.
    tablas = [
        "horario_disponible", "reserva", "asistencia", "incidencia", 
        "laboratorio", "usuario", "perfil_docente", "perfil_estudiante"
    ]
    with connection.cursor() as cursor:
        for tabla in tablas:
            try:
                cursor.execute(f"TRUNCATE TABLE {tabla} RESTART IDENTITY CASCADE;")
            except Exception:
                pass 
    print("✨ Tablas dinámicas limpias.")

def seed_maestro():
    print("🚀 === INICIANDO CARGA MAESTRA LABSYNC UNTELS ===")
    
    # 0. Crear el esquema y datos maestros (Roles, Facultades)
    # Usamos try/except por si las tablas ya existen en local
    try:
        ejecutar_sql_archivo('labsync_schema.sql')
    except Exception:
        print("ℹ️  Esquema ya existente, continuando...")

    # 1. Limpiar solo lo necesario
    limpiar_tablas()

    # 2. Cargar Datos Semilla en orden
    ejecutar_sql_archivo('seed_demo.sql')
    ejecutar_sql_archivo('seed_laboratorios.sql')
    ejecutar_sql_archivo('seed_horarios_semana.sql')

    print("\n🏁 === PROCESO COMPLETADO CON ÉXITO ===")
    print("💡 Credenciales:")
    print("   - Admin: ADM0001 / AdminLab_2026")
    print("   - Docente: D0001 / DocSist_2026")

if __name__ == '__main__':
    seed_maestro()
