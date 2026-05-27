import logging
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.db import connection

logger = logging.getLogger('reservas')


@api_view(['GET'])
def health_check(request):
    """Verifica que el servicio esté activo y que la BD sea accesible."""
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
        return Response({
            "status": "ok",
            "database": "connected",
            "message": "Servicio operativo y autenticado"
        }, status=200)
    except Exception as e:
        logger.error("FALLO DE HEALTH CHECK: %s", e)
        return Response({
            "status": "error",
            "database": "disconnected",
            "detail": str(e)
        }, status=500)
