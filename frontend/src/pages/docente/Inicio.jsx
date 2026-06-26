import { useState, useEffect, useCallback } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import reservaService from "../../services/reservaService";

const ESTADO_STYLE = {
  Programada: { bg: '#dbeafe', color: '#1d4ed8' },
  Pendiente:  { bg: '#fef3c7', color: '#92400e' },
  Completada: { bg: '#d1fae5', color: '#065f46' },
  Cancelada:  { bg: '#fee2e2', color: '#991b1b' },
};

function DocenteInicio() {
  const navigate = useNavigate();
  const { showToast } = useOutletContext();
  const userId = localStorage.getItem("id_usuario") || "";
  const nombre = localStorage.getItem("nombre") || "Docente";
  const depto  = localStorage.getItem("departamento") || "";

  const [misReservas, setMisReservas] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchMisReservas = useCallback(async (signal) => {
    if (!userId) { setLoading(false); return; }
    try {
      const data = await reservaService.getMisReservas(userId, { signal });
      setMisReservas(data);
    } catch (err) {
      if (err.name !== 'CanceledError' && err.code !== 'ERR_CANCELED')
        showToast('error', 'Error al cargar estadísticas');
    } finally {
      setLoading(false);
    }
  }, [userId, showToast]);

  useEffect(() => {
    const abortCtrl = new AbortController();
    fetchMisReservas(abortCtrl.signal);
    return () => abortCtrl.abort();
  }, [fetchMisReservas]);

  const stats = [
    { label: 'Reservas Activas', val: misReservas.filter(r => r.estado === 'Programada').length, color: '#3b82f6' },
    { label: 'Completadas',      val: misReservas.filter(r => r.estado === 'Completada').length,  color: '#10b981' },
    { label: 'Canceladas',       val: misReservas.filter(r => r.estado === 'Cancelada').length,   color: '#ef4444' },
  ];

  const proxima = misReservas
    .filter(r => r.estado === 'Programada')
    .sort((a, b) => {
      const da = new Date(`${a.fecha_reserva}T${a.hora_inicio || '00:00'}`);
      const db = new Date(`${b.fecha_reserva}T${b.hora_inicio || '00:00'}`);
      return da - db;
    })[0] || null;

  const primerNombre = nombre.split(' ')[0];

  return (
    <div className="doc-welcome">
      <div className="doc-welcome-text">
        <h1>Bienvenido, {primerNombre}</h1>
        <p>{depto || 'Gestiona tus reservas de laboratorio desde este panel.'}</p>
      </div>

      <div className="doc-stat-cards">
        {stats.map(c => (
          <div key={c.label} className="doc-stat-card">
            <span className="doc-stat-val" style={{ color: c.color }}>
              {loading ? '—' : c.val}
            </span>
            <span className="doc-stat-lbl">{c.label}</span>
          </div>
        ))}
      </div>

      {!loading && proxima && (
        <div className="doc-proxima-card">
          <div className="doc-proxima-label">Próxima Reserva</div>
          <div className="doc-proxima-lab">{proxima.laboratorio_nombre || 'Laboratorio'}</div>
          <div className="doc-proxima-time">
            {proxima.fecha_reserva}
            {proxima.hora_inicio ? ` · ${proxima.hora_inicio.slice(0,5)}` : ''}
            {proxima.hora_fin    ? ` – ${proxima.hora_fin.slice(0,5)}`    : ''}
            {proxima.cantidad_alumnos ? ` · ${proxima.cantidad_alumnos} alumnos` : ''}
          </div>
          <span className="doc-proxima-badge" style={ESTADO_STYLE['Programada']}>Programada</span>
        </div>
      )}

      {!loading && !proxima && misReservas.length === 0 && (
        <div className="doc-empty-hint">
          No tienes reservas próximas. Crea tu primera reserva cuando lo necesites.
        </div>
      )}

      <button className="doc-cta" onClick={() => navigate('/docente/reservar')}>
        + Crear Nueva Reserva
      </button>
    </div>
  );
}

export default DocenteInicio;
