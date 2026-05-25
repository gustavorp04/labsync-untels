# pyrefly: ignore [missing-import]
from django.test import TestCase
# pyrefly: ignore [missing-import]
from django.urls import reverse
from unittest.mock import patch
from django.utils import timezone
from datetime import timedelta

# Modelos personalizados de la aplicación
from reservas.models import Usuario, SesionUsuario, Rol

# Cliente de rest_framework
# pyrefly: ignore [missing-import]
from rest_framework.test import APIClient


class LaboratorioAPITests(TestCase):

    def setUp(self):
        """Crear usuario y sesión de prueba para autenticación personalizada"""
        self.client = APIClient()
        
        # 1. Crear el rol necesario para el usuario
        self.rol = Rol.objects.create(nombre='estudiante')
        
        # 2. Crear el usuario en nuestro modelo personalizado
        self.user = Usuario.objects.create(
            id_rol=self.rol,
            nombre='Usuario de Pruebas',
            email='testuser@untels.edu.pe',
            password_hash='dummy_password_hash',
            codigo_universitario='2026100100',
            created_at=timezone.now()
        )
        
        # 3. Crear la sesión activa para el usuario (Token Bearer)
        self.token_value = 'dummy_token_hex_32_chars_value'
        self.sesion = SesionUsuario.objects.create(
            id_usuario=self.user,
            token=self.token_value,
            fecha_expiracion=timezone.now() + timedelta(hours=24)
        )
        
        # 4. Configurar las credenciales de cabecera Bearer en el cliente
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token_value}')

    @patch('reservas.views.laboratorio_views.LaboratorioListView.get_queryset')
    def test_get_laboratorios_list(self, mock_get_queryset):
        """Prueba que el endpoint de laboratorios responda 200 usando Mocking"""
        mock_get_queryset.return_value = []
        url = reverse('v1-laboratorio-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)