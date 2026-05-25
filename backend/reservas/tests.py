# pyrefly: ignore [missing-import]
from django.test import TestCase
# pyrefly: ignore [missing-import]
from django.urls import reverse
from unittest.mock import patch
# pyrefly: ignore [missing-import]
from django.contrib.auth.models import User
# pyrefly: ignore [missing-import]
from rest_framework.test import APIClient
# pyrefly: ignore [missing-import]
from rest_framework.authtoken.models import Token


class LaboratorioAPITests(TestCase):

    def setUp(self):
        """Crear usuario y token de prueba para autenticación"""
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass123'
        )
        self.token = Token.objects.create(user=self.user)
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + self.token.key)

    @patch('reservas.views.laboratorio_views.LaboratorioListView.get_queryset')
    def test_get_laboratorios_list(self, mock_get_queryset):
        """Prueba que el endpoint de laboratorios responda 200 usando Mocking"""
        mock_get_queryset.return_value = []
        url = reverse('v1-laboratorio-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)