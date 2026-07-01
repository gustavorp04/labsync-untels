import { useState } from "react";
import { useOutletContext } from "react-router-dom";

function AdminHoy() {
  const {
    reservas,
    setReservaDetalleModal,
    handleCancelarReservaAdmin,
    handleAsistencia,
    fetchReservas,
  } = useOutletContext();

  const [labSeleccionado, setLabSeleccionado] = useState(null);
  const [asistencia, setAsistencia] = useState({});
  const [guardando, setGuardando] = useState(false);

  const hoyStr = new Date().toLocaleDateString('en-CA');

  const reservasHoy = reservas.filter(
    (r) =>
      r.fecha_reserva === hoyStr &&
      (r.estado === 'Programada' || r.estado === 'Pendiente')
  );

  const porLab = reservasHoy.reduce((acc, r) => {
    const key = r.laboratorio_nombre;
    if (!acc[key]) acc[key] = [];
    acc[key].push(r);
    return acc;
  }, {});

  const labsConReservas = Object.entries(porLab);

  function abrirLab(nombre, reservasLab) {
    const estado = {};
    reservasLab.forEach((r) => { estado[r.id_reserva] = true; });
    setAsistencia(estado);
    setLabSeleccionado({ nombre, reservas: reservasLab });
  }

  function volver() {
    setLabSeleccionado(null);
    setAsistencia({});
  }

  function toggleAsistencia(id) {
    setAsistencia((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  async function guardarAsistencia() {
    setGuardando(true);
    try {
      await Promise.all(
        labSeleccionado.reservas.map((r) =>
          handleAsistencia(r.id_reserva, asistencia[r.id_reserva] ?? true)
        )
      );
      await fetchReservas();
      volver();
    } finally {
      setGuardando(false);
    }
  }

  // ── Vista 2 — Alumnos de un laboratorio ──────────────────────────────────
  if (labSeleccionado) {
    const horario = `${labSeleccionado.reservas[0]?.hora_inicio} - ${labSeleccionado.reservas[0]?.hora_fin}`;
    return (
      <div className="table-section">
        <div className="top-actions" style={{ marginBottom: '8px' }}>
          <button
            onClick={volver}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '14px',
              color: 'var(--accent-color)',
              padding: '4px 0',
              fontWeight: 600,
            }}
          >
            ← Volver
          </button>
        </div>
        <h2 style={{ marginBottom: '4px' }}>{labSeleccionado.nombre}</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '16px' }}>
          Horario: {horario}
        </p>
        <table>
          <thead>
            <tr>
              <th>Rol</th>
              <th>Nombre</th>
              <th>Equipo reservado</th>
              <th>Asistencia</th>
              <th>Opciones</th>
            </tr>
          </thead>
          <tbody>
            {labSeleccionado.reservas.map((r) => {
              const asistio = asistencia[r.id_reserva] ?? true;
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
                    <button
                      onClick={() => toggleAsistencia(r.id_reserva)}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '6px',
                        border: 'none',
                        cursor: 'pointer',
                        fontWeight: 600,
                        fontSize: '12px',
                        background: asistio
                          ? 'rgba(16,185,129,0.15)'
                          : 'rgba(239,68,68,0.15)',
                        color: asistio ? '#10b981' : '#ef4444',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {asistio ? '✓ Asistió' : '✗ No asistió'}
                    </button>
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
        <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={guardarAsistencia}
            disabled={guardando}
            style={{
              padding: '10px 28px',
              borderRadius: '8px',
              border: 'none',
              cursor: guardando ? 'not-allowed' : 'pointer',
              fontWeight: 700,
              fontSize: '14px',
              background: guardando ? 'rgba(99,102,241,0.5)' : 'var(--accent-color)',
              color: '#fff',
              opacity: guardando ? 0.7 : 1,
              transition: 'all 0.2s ease',
            }}
          >
            {guardando ? 'Guardando…' : '💾 Guardar asistencia'}
          </button>
        </div>
      </div>
    );
  }

  // ── Vista 1 — Lista de laboratorios ──────────────────────────────────────
  return (
    <div className="table-section">
      <h2>Registro de Asistencia — Hoy</h2>
      <table>
        <thead>
          <tr>
            <th>Laboratorio</th>
            <th>Cantidad de reservas</th>
            <th>Horario(s)</th>
            <th>Acción</th>
          </tr>
        </thead>
        <tbody>
          {labsConReservas.length === 0 ? (
            <tr>
              <td colSpan="4" style={{ textAlign: 'center' }}>
                No hay reservas activas para hoy.
              </td>
            </tr>
          ) : (
            labsConReservas.map(([nombre, rs]) => {
              const horarios = [
                ...new Set(rs.map((r) => `${r.hora_inicio} - ${r.hora_fin}`)),
              ].join(', ');
              return (
                <tr key={nombre}>
                  <td>{nombre}</td>
                  <td>{rs.length}</td>
                  <td>{horarios}</td>
                  <td>
                    <button
                      className="view-btn"
                      onClick={() => abrirLab(nombre, rs)}
                      style={{ background: 'var(--accent-color)', color: '#fff' }}
                    >
                      Ver alumnos →
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

export default AdminHoy;
