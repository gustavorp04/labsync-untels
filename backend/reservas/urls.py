# reservas/urls.py
from django.urls import path
from .views import login
from .views import health_check
from . import views

urlpatterns = [
    path('login/', login),
    path('health/', health_check),
    path('api/laboratorios/', views.LaboratorioListView.as_view(), name='laboratorio-list'),
    path('api/laboratorios/<int:id_laboratorio>/activos/', views.LaboratorioDetailView.as_view(), name='laboratorio-detail'),
    path('api/activos/<int:id_activo>/', views.ActivoLaboratorioUpdateView.as_view(), name='activo-update'),
    
]