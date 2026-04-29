from django.urls import path
from .views import auth_views, laboratorio_views, system_views

urlpatterns = [
    # Auth
    path('api/login/', auth_views.login, name='login'),
    path('api/forgot-password/', auth_views.forgot_password, name='forgot-password'),
    path('api/reset-password/', auth_views.reset_password, name='reset-password'),
    path('api/verify-token/', auth_views.verify_token, name='verify-token'),
    
    # Laboratorios e Inventario
    path('api/laboratorios/', laboratorio_views.LaboratorioListView.as_view(), name='laboratorio-list'),
    path('api/laboratorios/<int:id_laboratorio>/activos/', laboratorio_views.LaboratorioDetailView.as_view(), name='laboratorio-detail'),
    path('api/activos/<int:id_activo>/', laboratorio_views.ActivoLaboratorioUpdateView.as_view(), name='activo-update'),
    
    # Sistema
    path('health/', system_views.health_check, name='health-check'),
]