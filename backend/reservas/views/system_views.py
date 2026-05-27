import logging
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db import connection
from ..utils.auth import IsAdminOrJefatura

logger = logging.getLogger('reservas')

@api_view(['GET'])
def health_check(request):
    """
    Verifica que el servicio esté activo y que la base de datos sea accesible de verdad.
    """
    try:
        # Esto obliga a Django a conectarse y autenticarse en la BD
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
        
        return Response({
            "status": "ok",
            "database": "connected",
            "message": "Servicio operativo y autenticado"
        }, status=200)
    except Exception as e:
        logger.error(f"FALLO DE HEALTH CHECK: {str(e)}")
        return Response({
            "status": "error",
            "database": "disconnected",
            "detail": str(e)
        }, status=500)

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdminOrJefatura])  # ID-02: solo admin/jefatura
def run_seed_emergency(request):
    """
    Ruta de emergencia para ejecutar el seed y corregir el esquema desde el navegador.
    """
    from django.conf import settings
    if not settings.DEBUG:
        return Response({"status": "forbidden", "message": "Acción no permitida en producción"}, status=403)

    from seed import main as run_seed
    try:
        from fix_and_inject import main as run_fix
    except ImportError:
        run_fix = None
        
    import io
    from contextlib import redirect_stdout

    f = io.StringIO()
    try:
        with redirect_stdout(f):
            print("--- INICIANDO SEED BASE ---")
            run_seed()
            if run_fix:
                print("\n--- INICIANDO FIX DE ESQUEMA E INYECCIÓN ---")
                run_fix()
            else:
                print("\n--- WARNING: fix_and_inject.py no encontrado ---")
                
        output = f.getvalue()
        return Response({"status": "success", "log": output})
    except Exception as e:
        import traceback
        error_stack = traceback.format_exc()
        return Response({"status": "error", "message": str(e), "trace": error_stack}, status=500)
