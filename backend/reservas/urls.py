from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import auth_views, laboratorio_views, system_views, reserva_views, api_views, inventario_views

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
    # AUTH & CUENTAS (Top-level)
    # -------------------------------------------------------------------------
    path('api/auth/estudiante/login/', auth_views.login_estudiante, name='login-estudiante'),
    path('api/auth/docente/login/', auth_views.login_docente, name='login-docente'),
    path('api/auth/admin/login/', auth_views.login_admin, name='login-admin'),
    path('api/auth/admin_lab/login/', auth_views.login_admin, name='login-admin-lab'),
    path('api/auth/jefatura/login/', auth_views.login_jefatura, name='login-jefatura'),
    path('api/forgot-password/', auth_views.forgot_password, name='forgot-password'),
    path('api/reset-password/', auth_views.reset_password, name='reset-password'),
    path('api/verify-token/', auth_views.verify_token, name='verify-token'),
    
    # -------------------------------------------------------------------------
    # -------------------------------------------------------------------------
    # API V1: LABORATORIOS E INVENTARIO
    # -------------------------------------------------------------------------
    path('api/v1/laboratorios/', laboratorio_views.LaboratorioListView.as_view(), name='v1-laboratorio-list'),
    path('api/v1/laboratorios/<int:id_laboratorio>/', laboratorio_views.LaboratorioDetailView.as_view(), name='v1-laboratorio-detail'),

    # Rutas Anidadas RESTful v1 (Laboratorios)
    path('api/v1/laboratorios/<int:id_laboratorio>/activos/', inventario_views.ActivosPorLaboratorioView.as_view(), name='v1-activos-por-lab'),
    path('api/v1/laboratorios/<int:id_laboratorio>/activos/<int:id_activo>/estado/', inventario_views.ActivoUpdateView.as_view(), name='v1-activo-update-estado'),
    path('api/v1/laboratorios/<int:id_laboratorio>/activos/<int:id_activo>/historial/', inventario_views.HistorialPorActivoView.as_view(), name='v1-historial-por-activo'),
    path('api/v1/laboratorios/<int:id_laboratorio>/horarios/', reserva_views.horarios_por_laboratorio, name='v1-horarios-por-lab'),
    path('api/v1/laboratorios/<int:id_laboratorio>/historial/', inventario_views.HistorialPorLaboratorioView.as_view(), name='v1-historial-por-lab'),
    path('api/v1/laboratorios/<int:id_laboratorio>/inhabilitar/', inventario_views.inhabilitar_laboratorio_view, name='v1-inhabilitar-laboratorio'),  # PBI-12

    # -------------------------------------------------------------------------
    # API V1: RESERVAS
    # -------------------------------------------------------------------------
    path('api/v1/reservas/<int:id_reserva>/asistencia/', reserva_views.marcar_asistencia, name='v1-marcar-asistencia'),
    path('api/v1/reservas/historial/', reserva_views.get_historial_reservas, name='v1-historial-reservas'),
    
    # Rutas Anidadas RESTful v1 (Usuarios)
    path('api/v1/usuarios/<int:id_usuario>/reservas/', reserva_views.mis_reservas, name='v1-mis-reservas'),
    path('api/v1/usuarios/<int:id_usuario>/reservas/<int:id_reserva>/cancelar/', reserva_views.cancelar_reserva, name='v1-cancelar-reserva'),

    # -------------------------------------------------------------------------
    # SISTEMA
    # -------------------------------------------------------------------------
    path('health/', system_views.health_check, name='health-check'),

    # -------------------------------------------------------------------------
    # API V1 (RUTAS AUTOMÁTICAS DEL ROUTER)
    # -------------------------------------------------------------------------
    path('api/v1/', include(router.urls)),
]