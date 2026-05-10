from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import auth_views, laboratorio_views, system_views, reserva_views, api_views

# =============================================================================
# ENRUTADOR AUTOMÁTICO (CRUD PARA EL FRONTEND)
# =============================================================================
router = DefaultRouter()
router.register(r'usuarios', api_views.UsuarioViewSet, basename='api-usuarios')
router.register(r'reservas', api_views.ReservaViewSet, basename='api-reservas')
router.register(r'incidencias', api_views.IncidenciaViewSet, basename='api-incidencias')
router.register(r'asistencias', api_views.AsistenciaViewSet, basename='api-asistencias')
router.register(r'horarios', api_views.HorarioDisponibleViewSet, basename='api-horarios')

urlpatterns = [
    # -------------------------------------------------------------------------
    # AUTH & CUENTAS
    # -------------------------------------------------------------------------
    path('api/auth/estudiante/login/', auth_views.login_estudiante, name='login-estudiante'),
    path('api/auth/docente/login/', auth_views.login_docente, name='login-docente'),
    path('api/auth/admin/login/', auth_views.login_admin, name='login-admin'),
    path('api/auth/jefatura/login/', auth_views.login_jefatura, name='login-jefatura'),
    path('api/forgot-password/', auth_views.forgot_password, name='forgot-password'),
    path('api/reset-password/', auth_views.reset_password, name='reset-password'),
    path('api/verify-token/', auth_views.verify_token, name='verify-token'),
    
    # -------------------------------------------------------------------------
    # LABORATORIOS E INVENTARIO (ESPECÍFICOS)
    # -------------------------------------------------------------------------
    path('api/laboratorios/', laboratorio_views.LaboratorioListView.as_view(), name='laboratorio-list'),
    path('api/laboratorios/<int:id_laboratorio>/activos/', laboratorio_views.LaboratorioDetailView.as_view(), name='laboratorio-detail'),
    path('api/activos/<int:id_activo>/', laboratorio_views.ActivoLaboratorioUpdateView.as_view(), name='activo-update'),
    
    # -------------------------------------------------------------------------
    # RESERVAS (DOCENTE)
    # -------------------------------------------------------------------------
    path('api/reservas/crear/', reserva_views.crear_reserva, name='crear-reserva'),

    # -------------------------------------------------------------------------
    # SISTEMA
    # -------------------------------------------------------------------------
    path('health/', system_views.health_check, name='health-check'),

    # -------------------------------------------------------------------------
    # API V1 (RUTAS AUTOMÁTICAS)
    # -------------------------------------------------------------------------
    # Aquí es donde tu compañero consumirá Reservas, Incidencias, etc.
    path('api/v1/', include(router.urls)),
]