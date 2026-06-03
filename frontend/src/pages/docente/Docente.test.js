import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Docente from './Docente';
import laboratorioService from '../../services/laboratorioService';
import reservaService from '../../services/reservaService';

// ─── Mocks de módulos ────────────────────────────────────────────────────────

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
}));

jest.mock('../../services/laboratorioService');
jest.mock('../../services/reservaService');
jest.mock('../../services/auth', () => ({ logoutUser: jest.fn().mockResolvedValue({}) }));

// ThemeToggle usa CSS variables que no existen en jsdom
jest.mock('../../components/ThemeToggle', () => () => null);

// getLabLayout sólo devuelve config de layout; no necesita lógica real en tests
jest.mock('../../components/labLayoutConfig', () => ({ getLabLayout: jest.fn(() => ({})) }));

// LabMap simplificado: renderiza un botón por activo para que los tests puedan
// seleccionar equipos sin depender del layout SVG real
jest.mock('../../components/LabMap', () => ({ activos = [], onSelect }) => (
  <div data-testid="lab-map">
    {activos.map((a) => (
      <button
        key={a.id_activo}
        data-testid={`equipo-${a.id_activo}`}
        onClick={() => onSelect(a)}
      >
        {a.codigo_patrimonio || a.num_serie}
      </button>
    ))}
  </div>
));

// ─── Fixtures ────────────────────────────────────────────────────────────────

const LAB = {
  id_laboratorio: 1,
  nombre: 'Lab Cómputo A1',
  codigo_patrimonio: 'A1-1',
  tipo_nombre: 'computo',
  equipos_operativos: 10,
  aforo_maximo: 12,
  habilitado: true,
};

const HORARIO = {
  id_horario: 100,
  fecha: '2026-06-10',
  hora_inicio: '08:00:00',
  hora_fin: '10:00:00',
  es_reservable: true,
};

const ACTIVO = {
  id_activo: 55,
  tipo_activo: 'CPU',
  tipo_activo_nombre: 'CPU',
  codigo_patrimonio: 'CP-055',
  num_serie: 'SN-A1-1-01',
  estado: 'Operativo',
  reservado: false,
  estado_reserva: null,
};

const RESERVA_PROGRAMADA = {
  id_reserva: 200,
  laboratorio_nombre: 'Lab Cómputo A1',
  fecha_reserva: '2026-06-10',
  hora_inicio: '08:00:00',
  hora_fin: '10:00:00',
  estado: 'Programada',
  cantidad_alumnos: 1,
};

// ─── Helper ──────────────────────────────────────────────────────────────────

function renderDocente() {
  return render(
    <MemoryRouter>
      <Docente />
    </MemoryRouter>
  );
}

// ─── Suite ───────────────────────────────────────────────────────────────────

describe('PBI-20 — Flujo crítico de reservas (Docente)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();

    // Simular sesión de docente de Sistemas (permite labs tipo Cómputo y Física)
    localStorage.setItem('id_usuario', '10');
    localStorage.setItem('nombre', 'Ana García');
    localStorage.setItem('departamento', 'Ingeniería de Sistemas');

    // Defaults de servicios para cada test
    laboratorioService.getLaboratorios.mockResolvedValue([LAB]);
    laboratorioService.getActivosPorLab.mockResolvedValue([ACTIVO]);
    reservaService.getHorariosPorLab.mockResolvedValue([HORARIO]);
    reservaService.getMisReservas.mockResolvedValue([]);
    reservaService.crearReserva.mockResolvedValue({ id_reserva: 300 });
    reservaService.cancelarReserva.mockResolvedValue({});
  });

  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    jest.restoreAllMocks();
  });

  // ── Test 1 ─────────────────────────────────────────────────────────────────
  test('(1) docente crea una reserva válida recorriendo los 5 pasos del wizard', async () => {
    renderDocente();

    // Abrir wizard de reserva desde la barra lateral (ancla exacta para no confundir con "Crear Nueva Reserva")
    userEvent.click(screen.getByRole('button', { name: /^Nueva Reserva$/i }));

    // Paso 1: seleccionar categoría de laboratorio
    userEvent.click(await screen.findByText('Cómputo'));

    // Paso 2: seleccionar laboratorio disponible
    userEvent.click(await screen.findByText('Lab Cómputo A1'));

    // Paso 3: seleccionar horario disponible
    userEvent.click(await screen.findByRole('button', { name: /08:00/i }));

    // Paso 4: mapa de equipos — seleccionar la PC
    userEvent.click(await screen.findByTestId('equipo-55'));

    // Avanzar al paso de confirmación
    const btnContinuar = await screen.findByRole('button', { name: /Continuar/i });
    userEvent.click(btnContinuar);

    // Paso 5: aceptar declaración jurada y confirmar
    await screen.findByRole('heading', { name: /Confirmar Reserva/i });
    userEvent.click(screen.getByRole('checkbox'));

    const btnConfirmar = screen.getByRole('button', { name: /Confirmar Reserva/i });
    expect(btnConfirmar).not.toBeDisabled();
    userEvent.click(btnConfirmar);

    // El servicio debe recibir el payload completo del wizard
    await waitFor(() =>
      expect(reservaService.crearReserva).toHaveBeenCalledWith({
        user_id: '10',
        id_horario: 100,
        cantidad_alumnos: 1,
        acepto_declaracion_jurada: true,
        activos_ids: [55],
      })
    );

    // Toast de confirmación debe aparecer
    await screen.findByText(/Reserva creada exitosamente/i);
  });

  // ── Test 2 ─────────────────────────────────────────────────────────────────
  test('(2) docente cancela una reserva existente exitosamente', async () => {
    reservaService.getMisReservas.mockResolvedValue([RESERVA_PROGRAMADA]);
    jest.spyOn(window, 'confirm').mockReturnValue(true);

    renderDocente();

    // Navegar a "Mis Reservas"
    userEvent.click(screen.getByRole('button', { name: /Mis Reservas/i }));

    // Esperar que aparezca la reserva cargada
    await screen.findByText('Lab Cómputo A1');

    // Disparar cancelación
    userEvent.click(screen.getByRole('button', { name: /^Cancelar$/i }));

    // El servicio debe llamarse con el id de reserva y el userId de sesión
    await waitFor(() =>
      expect(reservaService.cancelarReserva).toHaveBeenCalledWith(200, '10')
    );

    // Toast de éxito debe aparecer
    await screen.findByText(/Reserva cancelada/i);
  });
});
