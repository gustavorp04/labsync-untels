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
        fields = ['id_usuario', 'nombre', 'email', 'codigo_universitario', 'rol', 'carrera', 'ciclo', 'departamento', 'created_at']

    def get_departamento(self, obj):
        try:
            return obj.perfildocente.departamento
        except:
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
        except:
            return None

    def get_ciclo(self, obj):
        from ..models import PerfilEstudiante
        try:
            perfil = getattr(obj, 'perfilestudiante', None)
            if not perfil:
                perfil = PerfilEstudiante.objects.filter(id_usuario=obj).first()
            return perfil.ciclo if perfil else None
        except:
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