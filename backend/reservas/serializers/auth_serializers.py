import re
from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from ..models import Usuario

class UserSerializer(serializers.ModelSerializer):
    rol = serializers.CharField(source='id_rol.nombre', read_only=True)

    class Meta:
        model = Usuario
        fields = ['id_usuario', 'nombre', 'rol']

class LoginSerializer(serializers.Serializer):
    usuario = serializers.CharField(required=True)
    password = serializers.CharField(required=True, write_only=True)
    rol = serializers.CharField(required=True)

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
