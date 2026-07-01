import { useState } from "react";
import { useOutletContext } from "react-router-dom";

function AdminProgramadas() {
  const { reservas, setReservaDetalleModal, handleCancelarReservaAdmin } = useOutletContext();

  const [searchTerm, setSearchTerm] = useState("");
  const [labSeleccionado, setLabSeleccionado] = useState(null);
  const [horarioSeleccionado, setHorarioSeleccionado] = useState(null);
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin]       = useState('');

  const hoyStr = new Date().toLocaleDateString('en-CA');

  const reservasFuturas = reservas.filter(
    (r) =>
      r.fecha_reserva >= hoyStr &&
      (r.estado === 'Programada' || r.estado === 'Pendiente')
  );

  // ── Vista 1 helpers ───────────────────────────────────────────────────────
  const reservasFiltradas = reservasFuturas.filter(r => {
    if (fechaInicio && r.fecha_reserva < fechaInicio) return false;
    if (fechaFin   && r.fecha_reserva > fechaFin)   return false;
    return true;
  });

  const porLab = reservasFiltradas.reduce((acc, r) => {
    const key = r.laboratorio_nombre;
    if (!acc[key]) acc[key] = [];
    acc[key].push(r);
    return acc;
  }, {});

  const labsFiltrados = Object.entries(porLab).filter(([nombre]) =>
    nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  function abrirLab(nombre, rs) {
    setLabSeleccionado({ nombre, reservas: rs });
  }

  // ── Vista 2 helpers ───────────────────────────────────────────────────────
  function buildHorarios(rs) {
    const map = {};
    rs.forEach((r) => {
      const key = `${r.fecha_reserva}|${r.hora_inicio}|${r.hora_fin}`;
      if (!map[key]) {
        map[key] = { fecha: r.fecha_reserva, hora_inicio: r.hora_inicio, hora_fin: r.hora_fin, reservas: [] };
      }
      map[key].reservas.push(r);
    });
    return Object.values(map).sort((a, b) => a.fecha.localeCompare(b.fecha));
  }

  function abrirHorario(slot) {
    setHorarioSeleccionado(slot);
  }

  // ── Volver ────────────────────────────────────────────────────────────────
  function volverALabs() {
    setLabSeleccionado(null);
    setHorarioSeleccionado(null);
  }

  function volverAHorarios() {
    setHorarioSeleccionado(null);
  }

  const volverStyle = {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '14px',
    color: 'var(--accent-color)',
    padding: '4px 0',
    fontWeight: 600,
  };

  // ── Vista 3 — Alumnos de un horario ──────────────────────────────────────
  if (horarioSeleccionado) {
    return (
      <div className="table-section">
        <div className="top-actions" style={{ marginBottom: '8px' }}>
          <button onClick={volverAHorarios} style={volverStyle}>← Volver</button>
        </div>
        <h2 style={{ marginBottom: '4px' }}>{labSeleccionado.nombre}</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '16px' }}>
          {horarioSeleccionado.fecha} &nbsp;·&nbsp; {horarioSeleccionado.hora_inicio} - {horarioSeleccionado.hora_fin}
        </p>
        <table>
          <thead>
            <tr>
              <th>Rol</th>
              <th>Nombre</th>
              <th>Equipo reservado</th>
              <th>Estado</th>
              <th>Opciones</th>
            </tr>
          </thead>
          <tbody>
            {horarioSeleccionado.reservas.map((r) => {
              const equipo =
                r.activos?.[0]?.num_serie ||
                r.activos?.[0]?.codigo_patrimonio ||
                '—';
              return (
                <tr key={r.id_reserva}>
                  <td>
                    <span className={`badge-rol ${r.usuario_rol?.toLowerCase()}`}>
                      {r.usuario_rol || 'Usuario'}
                    </span>
                  </td>
                  <td>{r.usuario_nombre}</td>
                  <td>{equipo}</td>
                  <td>
                    <span className={`status-pill ${r.estado.toLowerCase()}`}>
                      {r.estado}
                    </span>
                  </td>
                  <td>
                    {(r.estado === 'Programada' || r.estado === 'Pendiente') && (
                      <div className="option-buttons">
                        <button
                          className="view-btn"
                          onClick={() => setReservaDetalleModal(r)}
                          style={{ background: 'var(--accent-color)', color: '#fff' }}
                        >
                          Ver
                        </button>
                        <button
                          className="delete-btn"
                          onClick={() => handleCancelarReservaAdmin(r)}
                        >
                          Cancelar
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }

  // ── Vista 2 — Horarios de un laboratorio ─────────────────────────────────
  if (labSeleccionado) {
    const horarios = buildHorarios(labSeleccionado.reservas);
    return (
      <div className="table-section">
        <div className="top-actions" style={{ marginBottom: '8px' }}>
          <button onClick={volverALabs} style={volverStyle}>← Volver</button>
        </div>
        <h2 style={{ marginBottom: '16px' }}>{labSeleccionado.nombre}</h2>
        <table>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Horario</th>
              <th>Cantidad alumnos</th>
              <th>Acción</th>
            </tr>
          </thead>
          <tbody>
            {horarios.map((slot) => (
              <tr key={`${slot.fecha}|${slot.hora_inicio}|${slot.hora_fin}`}>
                <td>{slot.fecha}</td>
                <td>{slot.hora_inicio} - {slot.hora_fin}</td>
                <td>{slot.reservas.length}</td>
                <td>
                  <button
                    className="view-btn"
                    onClick={() => abrirHorario(slot)}
                    style={{ background: 'var(--accent-color)', color: '#fff' }}
                  >
                    Ver alumnos →
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  // ── Vista 1 — Lista de laboratorios ──────────────────────────────────────
  return (
    <div className="table-section">
      <h2>Reservas Programadas</h2>
      <div className="top-actions">
        <input
          type="text"
          placeholder="Buscar laboratorio..."
          className="search-input"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <div className="date-range">
          <div>
            <label>Fecha Inicio</label>
            <input type="date" className="search-input"
                   value={fechaInicio}
                   onChange={e => setFechaInicio(e.target.value)} />
          </div>
          <div>
            <label>Fecha Fin</label>
            <input type="date" className="search-input"
                   value={fechaFin}
                   onChange={e => setFechaFin(e.target.value)} />
          </div>
        </div>
      </div>
      <table>
        <thead>
          <tr>
            <th>Laboratorio</th>
            <th>Cantidad de reservas</th>
            <th>Fecha(s)</th>
            <th>Acción</th>
          </tr>
        </thead>
        <tbody>
          {labsFiltrados.length === 0 ? (
            <tr>
              <td colSpan="4" style={{ textAlign: 'center', opacity: 0.6, padding: 20 }}>
                No hay reservas programadas.
              </td>
            </tr>
          ) : (
            labsFiltrados.map(([nombre, rs]) => {
              const fechas = [...new Set(rs.map((r) => r.fecha_reserva))]
                .sort()
                .join(', ');
              return (
                <tr key={nombre}>
                  <td>{nombre}</td>
                  <td>{rs.length}</td>
                  <td>{fechas}</td>
                  <td>
                    <button
                      className="view-btn"
                      onClick={() => abrirLab(nombre, rs)}
                      style={{ background: 'var(--accent-color)', color: '#fff' }}
                    >
                      Ver horarios →
                    </button>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

export default AdminProgramadas;
