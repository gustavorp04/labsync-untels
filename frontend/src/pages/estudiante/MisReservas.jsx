import { useState, useEffect, useCallback } from "react";
import { useOutletContext } from "react-router-dom";
import reservaService from "../../services/reservaService";

function StatusBadge({ estado }) {
  const cfg = {
    Programada: { bg: '#dbeafe', color: '#1d4ed8', dot: '#3b82f6' },
    Pendiente:  { bg: '#fef3c7', color: '#92400e', dot: '#f59e0b' },
    Completada: { bg: '#d1fae5', color: '#065f46', dot: '#10b981' },
    Cancelada:  { bg: '#fee2e2', color: '#991b1b', dot: '#ef4444' },
    'No-show':  { bg: '#f3f4f6', color: '#6b7280', dot: '#9ca3af' },
  }[estado] || { bg: '#f3f4f6', color: '#374151', dot: '#9ca3af' };
  return (
    <span style={{ background: cfg.bg, color: cfg.color, padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
      <span style={{ width: 7, height: 7, borderRadius: '50%', background: cfg.dot }} />
      {estado}
    </span>
  );
}

const ESTADOS_ACTIVOS = ['Programada', 'Pendiente'];

function EstudianteMisReservas() {
  const { showToast } = useOutletContext();
  const userId = localStorage.getItem("id_usuario") || "";

  const [misReservas, setMisReservas] = useState([]);
  const [reservaDetalle, setReservaDetalle] = useState(null);
  const [tab, setTab] = useState('activas');

  const fetchMisReservas = useCallback(async (signal) => {
    if (!userId) return;
    try {
      const data = await reservaService.getMisReservas(userId, { signal });
      setMisReservas(data);
    } catch (err) {
      if (err.name !== 'CanceledError' && err.code !== 'ERR_CANCELED') console.error(err);
    }
  }, [userId]);

  useEffect(() => {
    const abortCtrl = new AbortController();
    fetchMisReservas(abortCtrl.signal);
    const id = setInterval(() => fetchMisReservas(abortCtrl.signal), 10000);
    return () => { clearInterval(id); abortCtrl.abort(); };
  }, [fetchMisReservas]);

  const handleCancelar = async (id) => {
    if (!window.confirm('¿Cancelar esta reserva?')) return;
    try {
      await reservaService.cancelarReserva(id, userId);
      showToast('ok', 'Reserva cancelada correctamente.');
      fetchMisReservas();
    } catch (err) {
      showToast('error', err.response?.data?.error || 'No se pudo cancelar.');
    }
  };

  return (
    <div className="est-section">
      {reservaDetalle && (
        <div className="modal-overlay" onClick={() => setReservaDetalle(null)} style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center', overflowY: 'auto', padding: '40px 20px', zIndex: 9000 }}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 620, width: '90%', borderRadius: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, borderBottom: '1px solid var(--border-color)', paddingBottom: 12 }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 18 }}>Detalle de Reserva #{reservaDetalle.id_reserva}</h2>
                {reservaDetalle.created_at && (
                  <div style={{ fontSize: 12, opacity: 0.5, marginTop: 4, display: 'flex', alignItems: 'center', gap: 5 }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 13, height: 13 }}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    Reservado el {new Date(reservaDetalle.created_at).toLocaleString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
                  </div>
                )}
              </div>
              <button onClick={() => setReservaDetalle(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 22, lineHeight: 1 }}>×</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 14 }}>
              {[
                ['Laboratorio', reservaDetalle.laboratorio_nombre],
                ['Fecha', reservaDetalle.fecha_reserva],
                ['Horario', `${String(reservaDetalle.hora_inicio).slice(0,5)} – ${String(reservaDetalle.hora_fin).slice(0,5)}`],
                ['Estado', null],
              ].map(([label, val]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: 8 }}>
                  <span style={{ opacity: 0.6 }}>{label}</span>
                  {label === 'Estado' ? <StatusBadge estado={reservaDetalle.estado} /> : <strong>{val}</strong>}
                </div>
              ))}

              {reservaDetalle.activos?.length > 0 && (
                <div>
                  <div style={{ opacity: 0.6, marginBottom: 8, fontWeight: 600, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Equipo(s) reservado(s):</div>
                  {reservaDetalle.activos.map(a => (
                    <div key={a.id_activo} style={{ background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: 8, padding: '8px 12px', marginBottom: 6, fontSize: 13 }}>
                      <strong>{a.tipo_activo_nombre}</strong> · {a.codigo_patrimonio || a.num_serie}
                    </div>
                  ))}
                </div>
              )}

              {reservaDetalle.historial_cambios?.length > 0 && (
                <div style={{ marginTop: 4 }}>
                  <div style={{ opacity: 0.6, marginBottom: 10, fontWeight: 600, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Historial de cambios:</div>
                  <div style={{ position: 'relative', paddingLeft: 20 }}>
                    <div style={{ position: 'absolute', left: 7, top: 8, bottom: 8, width: 2, background: 'var(--border-color)', borderRadius: 2 }} />
                    {reservaDetalle.historial_cambios.map((log, i) => {
                      const colorMap = { 'Programada': '#3b82f6', 'Pendiente': '#f59e0b', 'Completada': '#10b981', 'Cancelada': '#ef4444', 'No-show': '#9ca3af' };
                      const dotColor = colorMap[log.estado_nuevo] || '#9ca3af';
                      return (
                        <div key={i} style={{ position: 'relative', marginBottom: i < reservaDetalle.historial_cambios.length - 1 ? 14 : 0, paddingLeft: 20 }}>
                          <div style={{ position: 'absolute', left: -13, top: 3, width: 10, height: 10, borderRadius: '50%', background: dotColor, border: '2px solid var(--bg-card)', boxShadow: `0 0 0 2px ${dotColor}40` }} />
                          <div style={{ background: 'var(--bg-input)', border: `1px solid var(--border-color)`, borderLeft: `3px solid ${dotColor}`, borderRadius: 8, padding: '8px 12px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
                              <span style={{ fontSize: 13 }}>
                                <span style={{ opacity: 0.6 }}>{log.estado_anterior}</span>
                                <span style={{ margin: '0 6px', opacity: 0.4 }}>→</span>
                                <strong style={{ color: dotColor }}>{log.estado_nuevo}</strong>
                              </span>
                              <span style={{ fontSize: 11, opacity: 0.5, display: 'flex', alignItems: 'center', gap: 4 }}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 11, height: 11 }}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                                {log.fecha_cambio}
                              </span>
                            </div>
                            {log.observacion && <div style={{ fontSize: 11, opacity: 0.55, marginTop: 4, fontStyle: 'italic' }}>📝 {log.observacion}</div>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end' }}>
              <button className="cancel-btn" onClick={() => setReservaDetalle(null)} style={{ padding: '8px 20px', borderRadius: 8, cursor: 'pointer' }}>Cerrar</button>
            </div>
          </div>
        </div>
      )}

      <h2>Mis Reservas</h2>

      {(() => {
        const activas = misReservas.filter(r => ESTADOS_ACTIVOS.includes(r.estado));
        const historial = misReservas.filter(r => !ESTADOS_ACTIVOS.includes(r.estado));
        const lista = tab === 'activas' ? activas : historial;
        const vacioMsg = tab === 'activas'
          ? 'No tienes reservas activas.'
          : 'Aún no tienes reservas en tu historial.';
        return (
      <>
      <div className="est-tabs">
        <button
          className={`est-tab ${tab === 'activas' ? 'active' : ''}`}
          onClick={() => setTab('activas')}
        >
          Activas <span className="est-tab-count">{activas.length}</span>
        </button>
        <button
          className={`est-tab ${tab === 'historial' ? 'active' : ''}`}
          onClick={() => setTab('historial')}
        >
          Historial <span className="est-tab-count">{historial.length}</span>
        </button>
      </div>

      <div className="est-reservas-list est-reservas-scroll">
        {lista.length === 0 && <p className="est-empty">{vacioMsg}</p>}
        {lista.map(r => (
          <div key={r.id_reserva} className="est-reserva-card">
            <div className="est-reserva-info">
              <div style={{ fontWeight: 600 }}>{r.laboratorio_nombre}</div>
              <div style={{ fontSize: 13, opacity: 0.6 }}>{r.fecha_reserva} · {String(r.hora_inicio).slice(0,5)} – {String(r.hora_fin).slice(0,5)}</div>
            </div>
            <div className="est-reserva-actions" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <StatusBadge estado={r.estado} />
              <button
                onClick={() => setReservaDetalle(r)}
                style={{ padding: '4px 12px', fontSize: 12, background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: 4, cursor: 'pointer', color: 'var(--text-main)' }}
              >
                Ver detalle
              </button>
              {ESTADOS_ACTIVOS.includes(r.estado) && (
                <button
                  className="est-btn-cancel"
                  style={{ padding: '4px 12px', fontSize: 12 }}
                  onClick={() => handleCancelar(r.id_reserva)}
                >
                  Cancelar
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
      </>
        );
      })()}
    </div>
  );
}

export default EstudianteMisReservas;
