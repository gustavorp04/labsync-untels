import { useOutletContext } from "react-router-dom";

function AdminHistorial() {
  const { historialReservas, reservas, setReservaDetalleModal } = useOutletContext();

  const handleClickReserva = (h) => {
    const resObj = reservas.find(r => r.id_reserva === h.reserva_id);
    if (resObj) {
      setReservaDetalleModal(resObj);
    } else {
      setReservaDetalleModal({
        id_reserva: h.reserva_id,
        usuario_nombre: h.usuario_nombre || 'Sistema',
        usuario_rol: h.usuario_rol || 'Automático',
        laboratorio_nombre: h.laboratorio,
        estado: h.estado_nuevo,
        fecha_reserva: new Date(h.fecha_cambio).toLocaleDateString('en-CA'),
        hora_inicio: '—', hora_fin: '—',
        cantidad_alumnos: 0, activos: [],
        id_laboratorio: null, id_horario: null,
      });
    }
  };

  return (
    <div className="table-section">
      <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20 }}>
        <h2>Historial de Cambios en Reservas</h2>
      </div>
      <table>
        <thead>
          <tr><th>Reserva ID</th><th>Laboratorio</th><th>Estado Anterior</th><th>Estado Nuevo</th><th>Fecha Cambio</th><th>Realizado por</th><th>Observación</th></tr>
        </thead>
        <tbody>
          {historialReservas.length === 0 ? (
            <tr><td colSpan="7" style={{ textAlign:'center',padding:20,opacity:0.5 }}>No hay registros de cambios aún.</td></tr>
          ) : historialReservas.map(h => (
            <tr key={h.id_historial}>
              <td>
                <button onClick={() => handleClickReserva(h)} style={{ background:'none',border:'none',color:'var(--accent-color)',cursor:'pointer',fontWeight:700,padding:0,textDecoration:'underline',fontFamily:'inherit' }}>
                  #{h.reserva_id}
                </button>
              </td>
              <td>{h.laboratorio}</td>
              <td><span className="status-pill gray">{h.estado_anterior}</span></td>
              <td><span className={`status-pill ${h.estado_nuevo === 'Completada' ? 'green' : h.estado_nuevo === 'No-show' ? 'red' : 'orange'}`}>{h.estado_nuevo}</span></td>
              <td style={{ fontSize:13 }}>{new Date(h.fecha_cambio).toLocaleString('es-PE')}</td>
              <td>
                <div style={{ display:'flex',flexDirection:'column' }}>
                  <span>{h.usuario_nombre || 'Sistema'}</span>
                  <small style={{ opacity:0.6,fontSize:10 }}>{h.usuario_rol || 'Automático'}</small>
                </div>
              </td>
              <td style={{ fontSize:12,maxWidth:200,wordBreak:'break-word' }}>{h.observacion || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default AdminHistorial;
