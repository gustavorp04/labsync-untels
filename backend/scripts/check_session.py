"""
Script diagnóstico — verifica si una sesion_usuario existe y su estado.
Uso:
    DATABASE_URL=postgres://... python backend/scripts/check_session.py <token_prefix>
    o
    cd backend && DATABASE_URL=... python scripts/check_session.py bb238e603d103dd1d914c03a
"""
import os
import sys
import django
from django.utils import timezone

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from reservas.models import SesionUsuario

token_prefix = sys.argv[1] if len(sys.argv) > 1 else 'bb238e603d103dd1d914c03a'
now = timezone.now()

print(f"\n=== Buscando sesión con token que empieza por: {token_prefix} ===")
print(f"Hora actual (UTC): {now}\n")

sesiones = SesionUsuario.objects.select_related(
    'id_usuario', 'id_usuario__id_rol'
).filter(token__startswith=token_prefix)

if not sesiones.exists():
    print(f"❌  NO EXISTE ninguna sesión con ese prefijo de token.")
    print("    → El token nunca se creó o fue eliminado de la BD.")
    sys.exit(1)

for s in sesiones:
    expirada = s.fecha_expiracion <= now
    diff = abs(s.fecha_expiracion - now)
    estado_str = f"EXPIRADA (hace {diff})" if expirada else f"ACTIVA  (faltan {diff})"
    print(f"id_sesion       : {s.id_sesion}")
    print(f"usuario         : {s.id_usuario.nombre}  (id={s.id_usuario.id_usuario})")
    print(f"rol             : {getattr(s.id_usuario.id_rol, 'nombre', '(sin rol)')}")
    print(f"fecha_creacion  : {s.fecha_creacion}")
    print(f"fecha_expiracion: {s.fecha_expiracion}")
    print(f"ahora (UTC)     : {now}")
    print(f"ESTADO          : {'❌ ' + estado_str if expirada else '✅ ' + estado_str}")
    print()
