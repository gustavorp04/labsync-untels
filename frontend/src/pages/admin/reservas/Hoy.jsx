import { useState } from "react";
import { useOutletContext } from "react-router-dom";

function AdminHoy() {
  const { reservas, setReservaDetalleModal, handleCancelarReservaAdmin, handleAsistencia } = useOutletContext();
  const [searchTerm, setSearchTerm] = useState("");

  const hoyStr = new Date().toLocaleDateString('en-CA');
  const filtered = reservas.filter(r => {
    const matchesSearch = r.usuario_nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          r.laboratorio_nombre.toLowerCase().includes(searchTerm.toLowerCase());
    return r.fecha_reserva === hoyStr && matchesSearch;
  });

  return (
    <div className="table-section">
      <h2>Reservas de Hoy</h2>
      <div className="top-actions">
        <input type="text" placeholder="Buscar reserva..." className="search-input" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        <div className="action-buttons"><button>Exportar PDF</button></div>
      </div>
      <table>
        <thead>
          <tr><th>Tipo Usuario</th><th>Usuario</th><th>Laboratorio</th><th>Fecha</th><th>Hora</th><th>Estado</th><th>Opciones</th></tr>
        </thead>
        <tbody>
          {filtered.map(r => (
            <tr key={r.id_reserva}>
              <td style={{ textTransform:'capitalize' }}>
                <span className={`badge-rol ${r.usuario_rol?.toLowerCase()}`}>{r.usuario_rol || 'Usuario'}</span>
              </td>
              <td>{r.usuario_nombre}</td>
              <td>{r.laboratorio_nombre}</td>
              <td>{r.fecha_reserva}</td>
              <td>{r.hora_inicio} - {r.hora_fin}</td>
              <td><span className={`status-pill ${r.estado.toLowerCase()}`}>{r.estado}</span></td>
              <td>
                <div className="option-buttons">
                  <button className="view-btn" onClick={() => setReservaDetalleModal(r)} style={{ background:'var(--accent-color)',color:'#fff' }}>Ver</button>
                  {(r.estado === 'Programada' || r.estado === 'Pendiente') && (
                    <>
                      <button className="asistio-btn" onClick={() => handleAsistencia(r.id_reserva, true)}>Asistió</button>
                      <button className="noshow-btn" onClick={() => handleAsistencia(r.id_reserva, false)}>No-Show</button>
                      <button className="delete-btn" onClick={() => handleCancelarReservaAdmin(r)}>Cancelar</button>
                    </>
                  )}
                </div>
              </td>
            </tr>
          ))}
          {filtered.length === 0 && (
            <tr><td colSpan="7" style={{ textAlign:'center' }}>No hay reservas para hoy.</td></tr>
          )}
        </tbody>
      </table>
      <div className="pagination"><button>1</button><button>2</button><button>3</button></div>
    </div>
  );
}

export default AdminHoy;
