# pyrefly: ignore [missing-import]
from django.test import TestCase
# pyrefly: ignore [missing-import]
from django.urls import reverse
from unittest.mock import patch
from django.utils import timezone
from datetime import timedelta

# Modelos personalizados de la aplicación
from reservas.models import (
    Usuario, SesionUsuario, Rol, Laboratorio, TipoLaboratorio, Facultad, 
    HorarioDisponible, Reserva, ActivoLaboratorio, TipoActivo, CategoriaActivo, 
    ReservaDetalle, HistorialReserva
)

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


class InhabilitacionLaboratorioTests(TestCase):

    def setUp(self):
        self.client = APIClient()
        
        # Roles
        self.student_rol = Rol.objects.create(nombre='estudiante')
        self.admin_rol = Rol.objects.create(nombre='admin_lab')
        
        # Facultad
        self.facultad = Facultad.objects.create(nombre='Ingeniería de Sistemas')
        
        # Tipo Laboratorio
        self.tipo_lab = TipoLaboratorio.objects.create(
            nombre='Laboratorio de Cómputo',
            min_equipos=2,
            tipo_equipo_minimo='PC'
        )
        
        # Laboratorio
        self.lab = Laboratorio.objects.create(
            id_tipo=self.tipo_lab,
            id_facultad=self.facultad,
            nombre='Laboratorio 101',
            codigo_patrimonio='LAB101-UNTELS',
            aforo_maximo=10,
            habilitado=True
        )
        
        # Activos
        self.cat_activo = CategoriaActivo.objects.create(nombre='Cómputo')
        self.tipo_activo = TipoActivo.objects.create(
            id_categoria=self.cat_activo,
            nombre='PC',
            descripcion='Computadoras de escritorio'
        )
        
        self.activo1 = ActivoLaboratorio.objects.create(
            id_laboratorio=self.lab,
            id_tipo_activo=self.tipo_activo,
            num_serie='SERIE001',
            codigo_patrimonio='PAT001',
            estado='Operativo',
            updated_at=timezone.now()
        )
        
        self.activo2 = ActivoLaboratorio.objects.create(
            id_laboratorio=self.lab,
            id_tipo_activo=self.tipo_activo,
            num_serie='SERIE002',
            codigo_patrimonio='PAT002',
            estado='Operativo',
            updated_at=timezone.now()
        )
        
        # Usuarios
        self.student = Usuario.objects.create(
            id_rol=self.student_rol,
            nombre='Estudiante Prueba',
            email='estudiante@untels.edu.pe',
            password_hash='pbkdf2_sha256$...',
            codigo_universitario='2026student',
            created_at=timezone.now()
        )
        
        self.admin = Usuario.objects.create(
            id_rol=self.admin_rol,
            nombre='Admin Prueba',
            email='admin@untels.edu.pe',
            password_hash='pbkdf2_sha256$...',
            codigo_universitario='2026admin',
            created_at=timezone.now()
        )
        
        # Sesiones
        self.student_token = 'student_token_value_32_chars_long_xyz'
        SesionUsuario.objects.create(
            id_usuario=self.student,
            token=self.student_token,
            fecha_expiracion=timezone.now() + timedelta(hours=2)
        )
        
        self.admin_token = 'admin_token_value_32_chars_long_abc'
        SesionUsuario.objects.create(
            id_usuario=self.admin,
            token=self.admin_token,
            fecha_expiracion=timezone.now() + timedelta(hours=2)
        )
        
        # Horario Disponible
        self.horario = HorarioDisponible.objects.create(
            id_laboratorio=self.lab,
            fecha=timezone.now().date() + timedelta(days=2),
            hora_inicio=timezone.now().time(),
            hora_fin=(timezone.now() + timedelta(hours=2)).time(),
            capacidad_total=10,
            capacidad_ocupada=1,
            estado='Disponible'
        )
        
        # Reserva
        self.reserva = Reserva.objects.create(
            id_usuario=self.student,
            id_horario=self.horario,
            cantidad_alumnos=1,
            acepto_declaracion_jurada=True,
            estado='Programada',
            created_at=timezone.now(),
            updated_at=timezone.now()
        )
        ReservaDetalle.objects.create(
            id_reserva=self.reserva,
            id_activo=self.activo1
        )

    @patch('reservas.services.laboratorio_service.enviar_email_inhabilitacion')
    def test_inhabilitacion_manual_api(self, mock_enviar_email):
        """Inhabilitar laboratorio de forma manual por el admin cancela reservas futuras y notifica"""
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.admin_token}')
        url = reverse('v1-inhabilitar-laboratorio', kwargs={'id_laboratorio': self.lab.id_laboratorio})
        
        response = self.client.post(url, {'motivo': 'Fumigación general del local'}, format='json')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['reservas_canceladas'], 1)
        self.assertIn('estudiante@untels.edu.pe', response.data['usuarios_notificados'])
        
        # Verificar estado del laboratorio
        self.lab.refresh_from_db()
        self.assertFalse(self.lab.habilitado)
        
        # Verificar estado de la reserva
        self.reserva.refresh_from_db()
        self.assertEqual(self.reserva.estado, 'Cancelada')
        
        # Verificar Historial de Reserva
        historial = HistorialReserva.objects.filter(reserva=self.reserva).first()
        self.assertIsNotNone(historial)
        self.assertEqual(historial.estado_nuevo, 'Cancelada')
        self.assertIn('Fumigación general del local', historial.observacion)
        
        # Verificar que se llamó al mock del correo
        mock_enviar_email.assert_called_once_with(
            email='estudiante@untels.edu.pe',
            nombre_usuario='Estudiante Prueba',
            nombre_lab='Laboratorio 101',
            fecha_reserva=self.horario.fecha.strftime('%d/%m/%Y'),
            motivo='Fumigación general del local'
        )

    @patch('reservas.services.laboratorio_service.enviar_email_inhabilitacion')
    def test_inhabilitacion_automatica_por_equipo(self, mock_enviar_email):
        """Cuando un equipo falla y se pasa el lab de habilitado a inhabilitado, se cancelan y notifican las reservas"""
        from reservas.services.laboratorio_service import actualizar_estado_activo
        
        # El laboratorio necesita min_equipos=2 operativos.
        # Actualmente tiene activo1 y activo2 (2 operativos).
        # Si actualizamos activo1 a 'Mantenimiento', el recuento baja a 1, inhabilitando el lab automáticamente.
        activo, laboratorio, mensajes, error = actualizar_estado_activo(
            id_activo=self.activo1.id_activo,
            nuevo_estado='Mantenimiento',
            motivo='Falla del procesador y fuente de poder',
            usuario_id=self.admin.id_usuario
        )
        
        self.assertIsNotNone(activo)
        self.assertIsNone(error)
        
        # El laboratorio debe inhabilitarse
        self.lab.refresh_from_db()
        self.assertFalse(self.lab.habilitado)
        
        # La reserva debe haberse cancelado automáticamente
        self.reserva.refresh_from_db()
        self.assertEqual(self.reserva.estado, 'Cancelada')
        
        # El historial de reserva debe documentar la inhabilitación automática
        historial = HistorialReserva.objects.filter(reserva=self.reserva).first()
        self.assertIsNotNone(historial)
        self.assertEqual(historial.estado_nuevo, 'Cancelada')
        self.assertIn('Falla de equipo crítico', historial.observacion)
        
        # Se debe notificar al estudiante
        mock_enviar_email.assert_called_once()
        args, kwargs = mock_enviar_email.call_args
        self.assertEqual(kwargs['email'], 'estudiante@untels.edu.pe')
        self.assertIn('Falla de equipo crítico: SERIE001', kwargs['motivo'])


class NotificacionIncidenciaTests(TestCase):

    def setUp(self):
        self.client = APIClient()
        
        # Roles
        self.student_rol = Rol.objects.create(nombre='estudiante')
        self.admin_rol = Rol.objects.create(nombre='admin_lab')
        
        # Facultad
        self.facultad = Facultad.objects.create(nombre='Ingeniería de Sistemas')
        
        # Tipo Laboratorio
        self.tipo_lab = TipoLaboratorio.objects.create(
            nombre='Laboratorio de Cómputo',
            min_equipos=2,
            tipo_equipo_minimo='PC'
        )
        
        # Laboratorio
        self.lab = Laboratorio.objects.create(
            id_tipo=self.tipo_lab,
            id_facultad=self.facultad,
            nombre='Laboratorio 101',
            codigo_patrimonio='LAB101-UNTELS',
            aforo_maximo=10,
            habilitado=True
        )
        
        # Activos
        self.cat_activo = CategoriaActivo.objects.create(nombre='Cómputo')
        self.tipo_activo = TipoActivo.objects.create(
            id_categoria=self.cat_activo,
            nombre='PC',
            descripcion='Computadoras de escritorio'
        )
        
        self.activo1 = ActivoLaboratorio.objects.create(
            id_laboratorio=self.lab,
            id_tipo_activo=self.tipo_activo,
            num_serie='SERIE001',
            codigo_patrimonio='PAT001',
            estado='Operativo',
            updated_at=timezone.now()
        )
        
        self.activo2 = ActivoLaboratorio.objects.create(
            id_laboratorio=self.lab,
            id_tipo_activo=self.tipo_activo,
            num_serie='SERIE002',
            codigo_patrimonio='PAT002',
            estado='Operativo',
            updated_at=timezone.now()
        )
        
        # Usuarios
        self.student = Usuario.objects.create(
            id_rol=self.student_rol,
            nombre='Estudiante Prueba',
            email='estudiante@untels.edu.pe',
            password_hash='pbkdf2_sha256$...',
            codigo_universitario='2026student',
            created_at=timezone.now()
        )
        
        self.admin = Usuario.objects.create(
            id_rol=self.admin_rol,
            nombre='Admin Prueba',
            email='admin@untels.edu.pe',
            password_hash='pbkdf2_sha256$...',
            codigo_universitario='2026admin',
            created_at=timezone.now()
        )
        
        # Sesiones
        self.admin_token = 'admin_token_value_32_chars_long_abc'
        SesionUsuario.objects.create(
            id_usuario=self.admin,
            token=self.admin_token,
            fecha_expiracion=timezone.now() + timedelta(hours=2)
        )
        
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.admin_token}')
        
        # Horario Disponible
        self.horario = HorarioDisponible.objects.create(
            id_laboratorio=self.lab,
            fecha=timezone.now().date() - timedelta(days=1),
            hora_inicio=timezone.now().time(),
            hora_fin=(timezone.now() + timedelta(hours=2)).time(),
            capacidad_total=10,
            capacidad_ocupada=1,
            estado='Disponible'
        )

    def test_registrar_incidencia_exitoso(self):
        """Registrar una incidencia vincula automáticamente con la última reserva completada del activo"""
        from reservas.models import Incidencia, HistorialMantenimiento
        
        # Crear reserva completada de ayer en activo1
        reserva = Reserva.objects.create(
            id_usuario=self.student,
            id_horario=self.horario,
            cantidad_alumnos=1,
            acepto_declaracion_jurada=True,
            estado='Completada',
            created_at=timezone.now(),
            updated_at=timezone.now()
        )
        res_detalle = ReservaDetalle.objects.create(
            id_reserva=reserva,
            id_activo=self.activo1
        )
        
        url = reverse('v1-activo-registrar-incidencia', kwargs={
            'id_laboratorio': self.lab.id_laboratorio,
            'id_activo': self.activo1.id_activo
        })
        
        response = self.client.post(url, {
            'descripcion_dano': 'Teclado con teclas rotas (F1-F5) y suelto.',
            'estado_activo_post': 'Mantenimiento'
        }, format='json')
        
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data['ok'], True)
        self.assertEqual(response.data['usuario_responsable'], 'Estudiante Prueba')
        
        # Verificar que se creó la incidencia
        incidencia = Incidencia.objects.filter(id_activo=self.activo1).first()
        self.assertIsNotNone(incidencia)
        self.assertEqual(incidencia.descripcion_dano, 'Teclado con teclas rotas (F1-F5) y suelto.')
        self.assertEqual(incidencia.id_detalle, res_detalle)
        
        # Verificar estado del activo
        self.activo1.refresh_from_db()
        self.assertEqual(self.activo1.estado, 'Mantenimiento')
        
        # Verificar historial de mantenimiento
        historial = HistorialMantenimiento.objects.filter(id_activo=self.activo1).first()
        self.assertIsNotNone(historial)
        self.assertEqual(historial.id_incidencia, incidencia)
        self.assertEqual(historial.estado_nuevo, 'Mantenimiento')

    def test_registrar_incidencia_sin_reservas_previas(self):
        """Intento de registrar incidencia sin reservas completadas retorna 400"""
        url = reverse('v1-activo-registrar-incidencia', kwargs={
            'id_laboratorio': self.lab.id_laboratorio,
            'id_activo': self.activo1.id_activo
        })
        
        response = self.client.post(url, {
            'descripcion_dano': 'Pantalla rota y rayada.',
            'estado_activo_post': 'Mantenimiento'
        }, format='json')
        
        self.assertEqual(response.status_code, 400)
        self.assertIn('No se encontró ninguna reserva Completada', response.data['error'])


from django.test import TransactionTestCase
import threading
from django.db import connection

class ConcurrenciaReservaTests(TransactionTestCase):
    def setUp(self):
        # Roles
        self.docente_rol = Rol.objects.create(nombre='docente')
        
        # Facultad
        self.facultad = Facultad.objects.create(nombre='Ingeniería')
        
        # Tipo Laboratorio
        self.tipo_lab = TipoLaboratorio.objects.create(
            nombre='Laboratorio de Prueba', min_equipos=2, tipo_equipo_minimo='PC'
        )
        
        # Laboratorio
        self.lab = Laboratorio.objects.create(
            id_tipo=self.tipo_lab,
            id_facultad=self.facultad,
            nombre='Lab de Concurrencia',
            codigo_patrimonio='LAB-CONCURRENCIA',
            aforo_maximo=30,
            habilitado=True
        )
        
        # Horario Disponible con capacidad_total de 30
        self.horario = HorarioDisponible.objects.create(
            id_laboratorio=self.lab,
            fecha=timezone.now().date() + timedelta(days=2),
            hora_inicio=timezone.now().time(),
            hora_fin=(timezone.now() + timedelta(hours=2)).time(),
            capacidad_total=30,
            capacidad_ocupada=0,
            estado='Disponible'
        )

        # 3 Usuarios Docentes
        self.docente1 = Usuario.objects.create(
            id_rol=self.docente_rol, nombre='Docente 1', email='d1@test.com',
            password_hash='hash', codigo_universitario='D001', created_at=timezone.now()
        )
        self.docente2 = Usuario.objects.create(
            id_rol=self.docente_rol, nombre='Docente 2', email='d2@test.com',
            password_hash='hash', codigo_universitario='D002', created_at=timezone.now()
        )
        self.docente3 = Usuario.objects.create(
            id_rol=self.docente_rol, nombre='Docente 3', email='d3@test.com',
            password_hash='hash', codigo_universitario='D003', created_at=timezone.now()
        )

    def test_evitar_reservas_excedentes_concurrencia(self):
        """
        PBI-20: Valida que tres peticiones concurrentes de reserva de docentes 
        que en total sumen más de la capacidad_total del laboratorio, 
        no dejen que el laboratorio exceda su capacidad, gracias a los locks en DB.
        """
        from reservas.services.reserva_service import crear_reserva_docente
        
        # Hilos ejecutarán este worker
        def worker(usuario, cantidad, results, index):
            try:
                reserva, error = crear_reserva_docente(
                    usuario=usuario,
                    horario=self.horario,
                    cantidad_alumnos=cantidad,
                    acepta_dj=True
                )
                results[index] = {'reserva': reserva, 'error': error}
            except Exception as e:
                results[index] = {'reserva': None, 'error': str(e)}
            finally:
                connection.close()

        results = [None] * 3
        # Docente 1 pide 20
        t1 = threading.Thread(target=worker, args=(self.docente1, 20, results, 0))
        # Docente 2 pide 15 (20+15 = 35 > 30, uno debe fallar)
        t2 = threading.Thread(target=worker, args=(self.docente2, 15, results, 1))
        # Docente 3 pide 5 (si D1=20 y D2 falla, D3 debería pasar si hay concurrencia correcta)
        t3 = threading.Thread(target=worker, args=(self.docente3, 5, results, 2))

        t1.start()
        t2.start()
        t3.start()

        t1.join()
        t2.join()
        t3.join()

        # Recargamos la capacidad final
        self.horario.refresh_from_db()

        # El aforo no debe exceder 30
        self.assertLessEqual(self.horario.capacidad_ocupada, 30)

        # Deberíamos tener al menos un fallo de exceso de capacidad
        errores = [r['error'] for r in results if r and r.get('error')]
        self.assertTrue(
            any("supera la capacidad" in e or "alcanzado su capacidad" in e or "locked" in str(e).lower() for e in errores),
            f"Se esperaba que alguna reserva fallara por capacidad excedida o lock. Resultados: {results}"
        )