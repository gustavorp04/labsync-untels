from django.test import TestCase
from django.urls import reverse
from unittest.mock import patch

class LaboratorioAPITests(TestCase):
    
    # El @patch intercepta la consulta a la base de datos antes de que suceda
    @patch('reservas.views.laboratorio_views.LaboratorioListView.get_queryset')
    def test_get_laboratorios_list(self, mock_get_queryset):
        """Prueba que el endpoint de laboratorios responda 200 usando Mocking"""
        
        # Le decimos a la prueba: "Finge que la BD nos devolvió una lista vacía"
        mock_get_queryset.return_value = []
        
        # Hacemos la petición a la URL
        url = reverse('v1-laboratorio-list')
        response = self.client.get(url)
        
        # Validamos que el servidor responda con Éxito (Estado HTTP 200 OK)
        self.assertEqual(response.status_code, 200)