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
    # AUTH & CUENTAS
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
    # LABORATORIOS E INVENTARIO (ESPECÍFICOS)
    # -------------------------------------------------------------------------
    path('api/laboratorios/', laboratorio_views.LaboratorioListView.as_view(), name='laboratorio-list'),
    path('api/laboratorios/<int:id_laboratorio>/activos/', inventario_views.ActivosPorLaboratorioView.as_view(), name='activos-por-lab'),
    path('api/laboratorios/<int:id_laboratorio>/historial/', inventario_views.HistorialPorLaboratorioView.as_view(), name='historial-por-lab'),
    path('api/laboratorios/<int:id_laboratorio>/detalle/', laboratorio_views.LaboratorioDetailView.as_view(), name='laboratorio-detail'),
    path('api/activos/<int:id_activo>/estado/', inventario_views.ActivoUpdateView.as_view(), name='activo-update-estado'),
    path('api/activos/<int:id_activo>/historial/', inventario_views.HistorialPorActivoView.as_view(), name='historial-por-activo'),
    
    # -------------------------------------------------------------------------
    # RESERVAS
    # -------------------------------------------------------------------------
    path('api/reservas/crear/', reserva_views.crear_reserva, name='crear-reserva'),
    path('api/reservas/crear-estudiante/', reserva_views.crear_reserva_estudiante, name='crear-reserva-estudiante'),
    path('api/reservas/mis-reservas/', reserva_views.mis_reservas, name='mis-reservas'),
    path('api/reservas/<int:id_reserva>/cancelar/', reserva_views.cancelar_reserva, name='cancelar-reserva'),
    path('api/reservas/<int:id_reserva>/asistencia/', reserva_views.marcar_asistencia, name='marcar-asistencia'),
    path('api/laboratorios/<int:id_laboratorio>/horarios/', reserva_views.horarios_por_laboratorio, name='horarios-por-lab'),

    # -------------------------------------------------------------------------
    # SISTEMA
    # -------------------------------------------------------------------------
    path('health/', system_views.health_check, name='health-check'),
    path('api/admin/run-seed/', system_views.run_seed_emergency, name='run-seed-emergency'),

    # -------------------------------------------------------------------------
    # API V1 (RUTAS AUTOMÁTICAS)
    # -------------------------------------------------------------------------
    # Aquí es donde tu compañero consumirá Reservas, Incidencias, etc.
    path('api/v1/', include(router.urls)),
]