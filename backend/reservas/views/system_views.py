from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.db import connection

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
        print(f"FALLO DE HEALTH CHECK: {str(e)}")
        return Response({
            "status": "error",
            "database": "disconnected",
            "detail": "Error de conexión o autenticación con PostgreSQL"
        }, status=500)
