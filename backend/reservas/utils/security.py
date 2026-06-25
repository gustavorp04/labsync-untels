"""Utilidades de seguridad a nivel de middleware."""
from django.http import JsonResponse

# Métodos que no mutan estado: no necesitan protección CSRF.
_METODOS_SEGUROS = frozenset({'GET', 'HEAD', 'OPTIONS', 'TRACE'})


class RequireRequestedWithForCookieAuthMiddleware:
    """S-1 (CWE-352): Protección CSRF para la autenticación basada en cookie.

    La API autentica con la cookie httpOnly `auth_token`, que el navegador
    adjunta automáticamente también en peticiones cross-site (la cookie usa
    SameSite=None en producción). Como `CustomTokenAuthentication` no valida
    ningún token CSRF, un sitio atacante podría disparar peticiones que mutan
    estado con la cookie de la víctima.

    Mitigación: exigir la cabecera **no-simple** `X-Requested-With` en toda
    petición que (a) muta estado, (b) apunta al API y (c) se autentica por
    cookie. Al ser una cabecera personalizada, el navegador obliga a un
    preflight CORS que la whitelist `CORS_ALLOWED_ORIGINS` gobierna, de modo
    que un origen no autorizado nunca llega a ejecutar la petición real.

    Los clientes que usan `Authorization: Bearer <token>` (Postman/Swagger/
    server-to-server) NO se ven afectados: ese token no se envía solo desde un
    navegador, así que no hay vector CSRF.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if (
            request.method not in _METODOS_SEGUROS
            and request.path.startswith('/api/')
            and 'auth_token' in request.COOKIES
            and not request.headers.get('Authorization')
            and request.headers.get('X-Requested-With') != 'XMLHttpRequest'
        ):
            return JsonResponse(
                {'error': 'Solicitud bloqueada: falta la cabecera X-Requested-With '
                          '(protección CSRF).'},
                status=403,
            )
        return self.get_response(request)
