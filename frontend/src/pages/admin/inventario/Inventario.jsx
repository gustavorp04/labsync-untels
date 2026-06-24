import { useNavigate, useOutletContext } from "react-router-dom";

function AdminInventario() {
  const { laboratorios } = useOutletContext();
  const navigate = useNavigate();

  return (
    <div className="table-section">
      <h2>Mapa de Inventario</h2>
      <div className="lab-inventory-grid">
        <p style={{ width:'100%',opacity:0.6,marginBottom:20 }}>Selecciona un laboratorio para gestionar su inventario y mapa:</p>
        <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill, minmax(240px, 1fr))',gap:20 }}>
          {laboratorios.map(lab => (
            <div key={lab.id_laboratorio} className="lab-card-admin" onClick={() => navigate(`/admin/inventario/${lab.id_laboratorio}`)}>
              <div className="lab-card-header">
                <span className={`status-dot ${lab.habilitado ? 'on' : 'off'}`} />
                <strong>{lab.codigo_patrimonio}</strong>
              </div>
              <div className="lab-card-body">
                <h4>{lab.nombre}</h4>
                <p>{lab.tipo_nombre}</p>
              </div>
              <div className="lab-card-footer">
                <span>Aforo: {lab.aforo_maximo}</span>
                <button className="btn-manage">Gestionar →</button>
              </div>
            </div>
          ))}
          {laboratorios.length === 0 && (
            <p style={{ opacity:0.6 }}>No hay laboratorios registrados.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminInventario;
