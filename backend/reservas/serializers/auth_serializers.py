import re
from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from ..models import Usuario

class UsuarioSerializer(serializers.ModelSerializer):
    rol = serializers.CharField(source='id_rol.nombre', read_only=True)
    departamento = serializers.SerializerMethodField()
    carrera = serializers.SerializerMethodField()
    ciclo = serializers.SerializerMethodField()

    class Meta:
        model = Usuario
        fields = ['id_usuario', 'nombre', 'email', 'codigo_universitario', 'rol', 'id_rol', 'carrera', 'ciclo', 'departamento', 'created_at']
        extra_kwargs = {
            'id_rol': {'write_only': True}
        }

    def validate(self, data):
        request = self.context.get('request')
        if request and request.user:
            # Si no es admin/jefatura, no puede cambiar su id_rol ni su codigo_universitario
            if request.user.id_rol.nombre not in ('admin_lab', 'jefatura'):
                if 'id_rol' in data:
                    raise serializers.ValidationError({"id_rol": "No tienes permiso para modificar tu rol."})
                if 'codigo_universitario' in data:
                    raise serializers.ValidationError({"codigo_universitario": "No tienes permiso para modificar tu código universitario."})
        return data

    def create(self, validated_data):
        from django.contrib.auth.hashers import make_password
        from django.utils import timezone
        from ..models import PerfilEstudiante, PerfilDocente, Carrera
        
        request = self.context.get('request')
        data = request.data if request else {}

        # 1. Hashear contraseña (por defecto el código universitario)
        raw_password = data.get('password') or validated_data.get('codigo_universitario')
        validated_data['password_hash'] = make_password(raw_password)
        validated_data['created_at'] = timezone.now()

        # 2. Crear el usuario
        user = super().create(validated_data)

        # 3. Crear Perfiles según el ROL
        rol_nombre = user.id_rol.nombre.lower()

        if rol_nombre == 'estudiante':
            carrera_nombre = data.get('carrera')
            ciclo = data.get('ciclo', 1)
            
            carrera_obj = None
            if carrera_nombre:
                carrera_obj = Carrera.objects.filter(nombre__icontains=carrera_nombre).first()
            if not carrera_obj:
                carrera_obj = Carrera.objects.first()
                if not carrera_obj:
                    raise serializers.ValidationError({"carrera": "No hay carreras registradas en el sistema."})
                
            PerfilEstudiante.objects.create(
                id_usuario=user,
                id_carrera=carrera_obj,
                ciclo=ciclo
            )

        elif rol_nombre == 'docente':
            departamento = data.get('departamento', 'General')
            PerfilDocente.objects.create(
                id_usuario=user,
                departamento=departamento
            )

        return user

    def get_departamento(self, obj):
        try:
            return obj.perfildocente.departamento
        except AttributeError:
            return None
        except Exception as e:
            import logging
            logger = logging.getLogger('reservas')
            logger.warning("Error al obtener departamento para usuario %s: %s", obj.id_usuario, e)
            return None

    def get_carrera(self, obj):
        from ..models import PerfilEstudiante
        try:
            # Intentamos acceder por relación inversa de Django
            perfil = getattr(obj, 'perfilestudiante', None)
            if not perfil:
                # Si falla, buscamos manualmente por id_usuario
                perfil = PerfilEstudiante.objects.filter(id_usuario=obj).first()
            
            return perfil.id_carrera.nombre if perfil else None
        except AttributeError:
            return None
        except Exception as e:
            import logging
            logger = logging.getLogger('reservas')
            logger.warning("Error al obtener carrera para usuario %s: %s", obj.id_usuario, e)
            return None

    def get_ciclo(self, obj):
        from ..models import PerfilEstudiante
        try:
            perfil = getattr(obj, 'perfilestudiante', None)
            if not perfil:
                perfil = PerfilEstudiante.objects.filter(id_usuario=obj).first()
            return perfil.ciclo if perfil else None
        except AttributeError:
            return None
        except Exception as e:
            import logging
            logger = logging.getLogger('reservas')
            logger.warning("Error al obtener ciclo para usuario %s: %s", obj.id_usuario, e)
            return None
class LoginSerializer(serializers.Serializer):
    # Aceptamos 'usuario', 'username' o 'email' y lo normalizamos a 'usuario'
    usuario = serializers.CharField(required=False)
    username = serializers.CharField(required=False)
    email = serializers.CharField(required=False)
    password = serializers.CharField(required=True, write_only=True)
    rol = serializers.CharField(required=True)

    def validate(self, data):
        # Normalización: el service espera el campo 'usuario'
        login_id = data.get('usuario') or data.get('username') or data.get('email')
        if not login_id:
            raise serializers.ValidationError("Debe proporcionar un usuario o correo.")
        
        data['usuario'] = login_id
        return data

class ResetPasswordSerializer(serializers.Serializer):
    token = serializers.CharField(required=True)
    password = serializers.CharField(required=True, write_only=True)

    def validate_password(self, value):
        if not re.search(r"[A-Z]", value):
            raise serializers.ValidationError("La contraseña debe tener al menos una letra mayúscula.")
        if not re.search(r"[0-9]", value):
            raise serializers.ValidationError("La contraseña debe tener al menos un número.")
        if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", value):
            raise serializers.ValidationError("La contraseña debe tener al menos un símbolo especial.")
        
        try:
            validate_password(value)
        except ValidationError as e:
            raise serializers.ValidationError(list(e.messages))
            
        return value
UserSerializer = UsuarioSerializer