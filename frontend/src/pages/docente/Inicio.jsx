import { useState, useEffect, useCallback } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import reservaService from "../../services/reservaService";

const Icon = {
  Plus: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>,
};

function DocenteInicio() {
  const navigate = useNavigate();
  const { showToast } = useOutletContext();
  const userId = localStorage.getItem("id_usuario") || "";
  const nombre = localStorage.getItem("nombre") || "Docente";

  const [misReservas, setMisReservas] = useState([]);

  const fetchMisReservas = useCallback(async (signal) => {
    if (!userId) return;
    try {
      const data = await reservaService.getMisReservas(userId, { signal });
      setMisReservas(data);
    } catch (err) {
      if (err.name !== 'CanceledError' && err.code !== 'ERR_CANCELED') showToast('error', 'Error al cargar estadísticas');
    }
  }, [userId, showToast]);

  useEffect(() => {
    const abortCtrl = new AbortController();
    fetchMisReservas(abortCtrl.signal);
    return () => abortCtrl.abort();
  }, [fetchMisReservas]);

  return (
    <div className="doc-welcome">
      <div className="doc-welcome-text">
        <h1>Bienvenido, {nombre.split(' ')[0]} 👋</h1>
        <p>Gestiona tus reservas de laboratorio desde este panel.</p>
      </div>
      <div className="doc-stat-cards">
        {[
          { label: 'Reservas Activas', val: misReservas.filter(r => r.estado === 'Programada').length,  color: '#3b82f6' },
          { label: 'Completadas',      val: misReservas.filter(r => r.estado === 'Completada').length,  color: '#10b981' },
          { label: 'Canceladas',       val: misReservas.filter(r => r.estado === 'Cancelada').length,   color: '#ef4444' },
        ].map(c => (
          <div key={c.label} className="doc-stat-card">
            <span className="doc-stat-val" style={{ color: c.color }}>{c.val}</span>
            <span className="doc-stat-lbl">{c.label}</span>
          </div>
        ))}
      </div>
      <button className="doc-cta" onClick={() => navigate('/docente/reservar')}>
        <Icon.Plus /> Crear Nueva Reserva
      </button>
    </div>
  );
}

export default DocenteInicio;
