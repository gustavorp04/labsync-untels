from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed
from rest_framework import permissions
from django.utils import timezone
from reservas.models import SesionUsuario

class CustomTokenAuthentication(BaseAuthentication):
    def authenticate(self, request):
        # C-2: primero intentar cookie httpOnly (no accesible desde JS)
        token = request.COOKIES.get('auth_token')

        # Fallback: header Authorization: Bearer <token>
        # (permite usar la API desde Postman/Swagger sin cookie)
        if not token:
            auth_header = request.headers.get('Authorization')
            if auth_header:
                if auth_header.startswith('Bearer '):
                    token = auth_header.split(' ')[1]
                elif auth_header.startswith('Token '):
                    token = auth_header.split(' ')[1]

        if not token:
            return None

        try:
            sesion = SesionUsuario.objects.select_related('id_usuario', 'id_usuario__id_rol').get(
                token=token,
                fecha_expiracion__gt=timezone.now()
            )
            return (sesion.id_usuario, token)
        except SesionUsuario.DoesNotExist:
            raise AuthenticationFailed('Token inválido o expirado')


class IsAdminOrJefatura(permissions.BasePermission):
    """
    Permite acceso solo a usuarios con el rol 'admin_lab' o 'jefatura'.
    """
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.id_rol and
            request.user.id_rol.nombre in ('admin_lab', 'jefatura')
        )


class IsAdminOrJefaturaOrSelf(permissions.BasePermission):
    """
    Permite a los administradores y jefaturas listar o crear.
    Los usuarios normales solo pueden ver o editar su propio registro.
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if view.action in ('list', 'create'):
            return bool(request.user.id_rol and request.user.id_rol.nombre in ('admin_lab', 'jefatura'))
        return True

    def has_object_permission(self, request, view, obj):
        if request.user.id_rol and request.user.id_rol.nombre in ('admin_lab', 'jefatura'):
            return True
        return obj.id_usuario == request.user.id_usuario


class IsAdminOrJefaturaOrReadOnly(permissions.BasePermission):
    """
    Permite lectura (SAFE_METHODS) a cualquier usuario autenticado.
    Las acciones de escritura requieren rol 'admin_lab' o 'jefatura'.
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.method in permissions.SAFE_METHODS:
            return True
        return bool(request.user.id_rol and request.user.id_rol.nombre in ('admin_lab', 'jefatura'))


