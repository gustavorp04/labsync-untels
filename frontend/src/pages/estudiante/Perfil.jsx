import { useState, useEffect } from "react";

function calcularConteo(fechaFin) {
  const diff = Math.max(0, new Date(fechaFin).getTime() - Date.now());
  return {
    dias:  Math.floor(diff / 86400000),
    horas: Math.floor((diff % 86400000) / 3600000),
    mins:  Math.floor((diff % 3600000)  / 60000),
    expirado: diff <= 0,
  };
}

function EstudiantePerfil() {
  const nombre  = localStorage.getItem("nombre")  || "Estudiante";
  const carrera = localStorage.getItem("carrera") || "—";
  const ciclo   = localStorage.getItem("ciclo")   || "";
  const codigo  = localStorage.getItem("id_usuario") || "—";
  const penalFin = localStorage.getItem("penalizacion_fin");
  const penalMotivo = localStorage.getItem("penalizacion_motivo") || "";

  const penalActiva = penalFin && new Date(penalFin) > new Date();
  const [conteo, setConteo] = useState(() => penalActiva ? calcularConteo(penalFin) : null);

  useEffect(() => {
    if (!penalActiva) return;
    const id = setInterval(() => {
      const nuevo = calcularConteo(penalFin);
      setConteo(nuevo);
      if (nuevo.expirado) clearInterval(id);
    }, 1000);
    return () => clearInterval(id);
  }, [penalActiva, penalFin]);

  const datos = [
    ['Nombre', nombre],
    ['Código', codigo],
    ['Carrera', carrera],
    ['Ciclo', ciclo ? `${ciclo}°` : '—'],
  ];

  return (
    <div className="est-section">
      <h2>Mi Perfil</h2>

      <div className="est-perfil-head">
        <div className="est-perfil-avatar">{nombre[0]?.toUpperCase()}</div>
        <div>
          <div className="est-perfil-name">{nombre}</div>
          <div className="est-perfil-sub">{carrera}{ciclo ? ` · ${ciclo}° Ciclo` : ''}</div>
        </div>
      </div>

      <div className="est-perfil-grid">
        {datos.map(([label, val]) => (
          <div key={label} className="est-perfil-item">
            <span className="est-perfil-label">{label}</span>
            <strong>{val}</strong>
          </div>
        ))}
      </div>

      <h3 className="est-section-title" style={{ marginTop: 28, marginBottom: 12 }}>Estado de la cuenta</h3>

      {penalActiva && conteo && !conteo.expirado ? (
        <div className="est-perfil-penal">
          <div className="est-perfil-penal-head">
            <span style={{ fontSize: 22 }}>🚫</span>
            <div>
              <strong style={{ color: '#ef4444' }}>Cuenta penalizada</strong>
              <div style={{ fontSize: 13, opacity: 0.7 }}>{penalMotivo || 'No se presentó a una reserva programada.'}</div>
            </div>
          </div>
          <div className="est-perfil-penal-count">
            Se levanta en <strong>{conteo.dias}d {String(conteo.horas).padStart(2,'0')}h {String(conteo.mins).padStart(2,'0')}m</strong>
            <span style={{ display: 'block', fontSize: 12, opacity: 0.6, marginTop: 4 }}>
              Hasta el {new Date(penalFin).toLocaleString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>
      ) : (
        <div className="est-perfil-ok">
          <span style={{ fontSize: 20 }}>✓</span>
          <span>Cuenta activa · sin penalizaciones. Puedes reservar normalmente.</span>
        </div>
      )}
    </div>
  );
}

export default EstudiantePerfil;
