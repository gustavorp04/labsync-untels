import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import EstudianteReservar from './Reservar';
import EstudianteMisReservas from './MisReservas';
import laboratorioService from '../../services/laboratorioService';
import reservaService from '../../services/reservaService';

// --- Mocks de módulos ---

let mockNavigate = jest.fn();
let mockShowToast = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useOutletContext: () => ({ showToast: mockShowToast }),
}));

jest.mock('../../services/laboratorioService');
jest.mock('../../services/reservaService');

jest.mock('../../components/ThemeToggle', () => () => null);

jest.mock('../../components/labLayoutConfig', () => ({ getLabLayout: jest.fn(() => ({})) }));

// LabMap simplificado: renderiza un botón por activo
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

// --- Fixtures ---

const LAB = {
  id_laboratorio: 1,
  nombre: 'Lab Cómputo A1',
  codigo_patrimonio: 'A1-1',
  tipo_nombre: 'computo',
  equipos_operativos: 10,
  aforo_maximo: 12,
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
};

// --- Suite ---

describe('PBI-14 — Flujo crítico de reservas (Estudiante)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigate = jest.fn();
    mockShowToast = jest.fn();
    localStorage.clear();
    sessionStorage.clear();

    localStorage.setItem('id_usuario', '42');
    localStorage.setItem('nombre', 'Carlos Pérez');
    localStorage.setItem('carrera', 'Ingeniería de Sistemas');
    localStorage.setItem('ciclo', '5');

    laboratorioService.getLaboratorios.mockResolvedValue([LAB]);
    laboratorioService.getActivosPorLab.mockResolvedValue([ACTIVO]);
    reservaService.getHorariosPorLab.mockResolvedValue([HORARIO]);
    reservaService.getMisReservas.mockResolvedValue([]);
    reservaService.crearReservaEstudiante.mockResolvedValue({ id_reserva: 201 });
    reservaService.cancelarReserva.mockResolvedValue({});
  });

  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    jest.restoreAllMocks();
  });

  test('(1) estudiante crea una reserva válida recorriendo los 4 pasos del wizard', async () => {
    render(
      <MemoryRouter>
        <EstudianteReservar />
      </MemoryRouter>
    );

    // Paso 1: seleccionar laboratorio
    userEvent.click(await screen.findByText('Lab Cómputo A1'));

    // Paso 2: seleccionar horario disponible
    userEvent.click(await screen.findByRole('button', { name: /08:00/i }));

    // Paso 3: mapa de equipos — seleccionar la PC
    userEvent.click(await screen.findByTestId('equipo-55'));

    const btnContinuar = await screen.findByRole('button', { name: /^Continuar$/i });
    expect(btnContinuar).not.toBeDisabled();
    userEvent.click(btnContinuar);

    // Paso 4: aceptar declaración jurada y confirmar
    await screen.findByRole('heading', { name: /Confirmar Reserva/i });
    userEvent.click(screen.getByRole('checkbox'));

    const btnConfirmar = screen.getByRole('button', { name: /Confirmar y Finalizar/i });
    expect(btnConfirmar).not.toBeDisabled();
    userEvent.click(btnConfirmar);

    await waitFor(() =>
      expect(reservaService.crearReservaEstudiante).toHaveBeenCalledWith({
        user_id: '42',
        id_horario: 100,
        id_activo: 55,
        acepto_declaracion_jurada: true,
      })
    );

    // Tras confirmar, el wizard avanza a la pantalla de sala de espera (paso 5)
    // que muestra el encabezado "¡Reserva registrada!" y el link de invitación.
    await screen.findByRole('heading', { name: /Reserva registrada/i });
    expect(screen.getByText(/Compartí este link/i)).toBeInTheDocument();
  });

  test('(2) estudiante cancela una reserva existente exitosamente', async () => {
    reservaService.getMisReservas.mockResolvedValue([RESERVA_PROGRAMADA]);
    jest.spyOn(window, 'confirm').mockReturnValue(true);

    render(
      <MemoryRouter>
        <EstudianteMisReservas />
      </MemoryRouter>
    );

    await screen.findByText('Lab Cómputo A1');

    userEvent.click(screen.getByRole('button', { name: /^Cancelar$/i }));

    await waitFor(() =>
      expect(reservaService.cancelarReserva).toHaveBeenCalledWith(200, '42')
    );

    await waitFor(() =>
      expect(mockShowToast).toHaveBeenCalledWith('ok', expect.stringMatching(/Reserva cancelada/i))
    );
  });
});
