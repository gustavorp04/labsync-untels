import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import reservaService from "../../services/reservaService";

const ESTADO_STYLE = {
  Programada: { bg: '#dbeafe', color: '#1d4ed8' },
  Pendiente:  { bg: '#fef3c7', color: '#92400e' },
  Completada: { bg: '#d1fae5', color: '#065f46' },
  Cancelada:  { bg: '#fee2e2', color: '#991b1b' },
  'No-show':  { bg: '#f3f4f6', color: '#6b7280' },
};

function EstudianteInicio() {
  const navigate = useNavigate();
  const nombre  = localStorage.getItem("nombre") || "Estudiante";
  const carrera = localStorage.getItem("carrera") || "";
  const ciclo   = localStorage.getItem("ciclo") || "";
  const userId  = localStorage.getItem("id_usuario") || "";

  const [reservas, setReservas] = useState([]);
  const [loading, setLoading]   = useState(true);

  const fetchReservas = useCallback(async () => {
    if (!userId) { setLoading(false); return; }
    try {
      const data = await reservaService.getMisReservas(userId);
      setReservas(data);
    } catch {}
    finally { setLoading(false); }
  }, [userId]);

  useEffect(() => { fetchReservas(); }, [fetchReservas]);

  const activas    = reservas.filter(r => r.estado === 'Programada').length;
  const pendientes = reservas.filter(r => r.estado === 'Pendiente').length;
  const completadas = reservas.filter(r => r.estado === 'Completada').length;

  const proximas = reservas
    .filter(r => r.estado === 'Programada' || r.estado === 'Pendiente')
    .sort((a, b) => {
      const da = new Date(`${a.fecha_reserva}T${a.hora_inicio || '00:00'}`);
      const db = new Date(`${b.fecha_reserva}T${b.hora_inicio || '00:00'}`);
      return da - db;
    })
    .slice(0, 3);

  const primerNombre = nombre.split(' ')[0];

  return (
    <div className="est-welcome">
      <div className="est-welcome-text">
        <h1>Bienvenido, {primerNombre}</h1>
        <p>{carrera}{ciclo ? ` · ${ciclo}° Ciclo` : ''}</p>
      </div>

      <div className="est-stat-cards">
        {[
          { label: 'Reservas Activas', val: activas,     color: '#3b82f6' },
          { label: 'Pendientes',        val: pendientes,  color: '#f59e0b' },
          { label: 'Completadas',       val: completadas, color: '#10b981' },
        ].map(c => (
          <div key={c.label} className="est-stat-card">
            <span className="est-stat-val" style={{ color: c.color }}>
              {loading ? '—' : c.val}
            </span>
            <span className="est-stat-lbl">{c.label}</span>
          </div>
        ))}
      </div>

      {!loading && proximas.length > 0 && (
        <div className="est-section-block">
          <h3 className="est-section-title">Próximas Reservas</h3>
          <div className="est-upcoming-list">
            {proximas.map(r => {
              const st = ESTADO_STYLE[r.estado] || {};
              return (
                <div key={r.id_reserva} className="est-upcoming-card">
                  <div className="est-upcoming-info">
                    <div className="est-upcoming-lab">{r.laboratorio_nombre || 'Laboratorio'}</div>
                    <div className="est-upcoming-time">
                      {r.fecha_reserva}
                      {r.hora_inicio ? ` · ${r.hora_inicio.slice(0,5)}` : ''}
                      {r.hora_fin    ? ` – ${r.hora_fin.slice(0,5)}`    : ''}
                    </div>
                  </div>
                  <span className="est-upcoming-badge" style={{ background: st.bg, color: st.color }}>
                    {r.estado}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {!loading && proximas.length === 0 && (
        <div className="est-empty-hint">
          No tienes reservas próximas. Reserva un laboratorio cuando lo necesites.
        </div>
      )}

      <button className="est-cta" onClick={() => navigate('/estudiante/reservar')}>
        + Reservar laboratorio
      </button>
    </div>
  );
}

export default EstudianteInicio;
