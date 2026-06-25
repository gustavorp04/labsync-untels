import { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation, Outlet } from "react-router-dom";
import reservaService from "../../services/reservaService";
import laboratorioService from "../../services/laboratorioService";
import { logoutUser } from "../../services/auth";
import LabMap from "../../components/LabMap";
import { getLabLayout } from "../../components/labLayoutConfig";
import ThemeToggle from "../../components/ThemeToggle";
import "./Admin.css";

const Icon = {
  Home:     () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  Calendar: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  Users:    () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><circle cx="19" cy="11" r="4"/></svg>,
  Package:  () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>,
  Logout:   () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
};

function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const [laboratorios, setLaboratorios]           = useState([]);
  const [reservas, setReservas]                   = useState([]);
  const [historialReservas, setHistorialReservas] = useState([]);
  const [feedbackMsg, setFeedbackMsg]             = useState(null);
  const [mostrarReservas, setMostrarReservas]     = useState(false);
  const [mostrarInventario, setMostrarInventario] = useState(false);

  const [reservaDetalleModal, setReservaDetalleModal] = useState(null);
  const [detalleMapActivos, setDetalleMapActivos]     = useState([]);
  const [loadingDetalleMap, setLoadingDetalleMap]     = useState(false);

  const [cancelModal, setCancelModal]   = useState(null);
  const [cancelMotivo, setCancelMotivo] = useState('');

  const isActive = useCallback((path) => location.pathname.startsWith(path), [location.pathname]);

  const fetchReservas = useCallback(async () => {
    try {
      const data = await reservaService.getTodasLasReservas();
      setReservas(data);
    } catch {
      setFeedbackMsg({ tipo: 'error', texto: 'Error al cargar las reservas.' });
    }
  }, []);

  const fetchHistorialReservas = useCallback(async () => {
    try {
      const data = await reservaService.getHistorialReservas();
      setHistorialReservas(data);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const fetchLaboratorios = useCallback(async () => {
    try {
      const data = await laboratorioService.getLaboratorios();
      setLaboratorios(data);
    } catch {
      setFeedbackMsg({ tipo: 'error', texto: 'Error al cargar los laboratorios.' });
    }
  }, []);

  useEffect(() => {
    fetchReservas();
    fetchLaboratorios();
    fetchHistorialReservas();
    const id = setInterval(() => { fetchReservas(); fetchHistorialReservas(); }, 10000);
    return () => clearInterval(id);
  }, [fetchReservas, fetchLaboratorios, fetchHistorialReservas]);

  // Auto-expand sidebar sections based on current route
  useEffect(() => {
    if (isActive('/admin/reservas')) setMostrarReservas(true);
    if (isActive('/admin/inventario')) setMostrarInventario(true);
  }, [isActive]);

  // Feedback auto-dismiss
  useEffect(() => {
    if (!feedbackMsg) return;
    const id = setTimeout(() => setFeedbackMsg(null), 3000);
    return () => clearTimeout(id);
  }, [feedbackMsg]);

  // Load map activos when detail modal opens
  useEffect(() => {
    if (!reservaDetalleModal) { setDetalleMapActivos([]); return; }
    const load = async () => {
      setLoadingDetalleMap(true);
      try {
        const data = await laboratorioService.getActivosPorLab(reservaDetalleModal.id_laboratorio, reservaDetalleModal.id_horario);
        setDetalleMapActivos(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingDetalleMap(false);
      }
    };
    load();
  }, [reservaDetalleModal]);

  const handleAsistencia = async (id, asistio) => {
    try {
      await reservaService.marcarAsistencia(id, asistio);
      setFeedbackMsg({ tipo: 'ok', texto: `Reserva marcada como ${asistio ? 'Asistió' : 'No-Show'}` });
      fetchReservas();
    } catch (error) {
      setFeedbackMsg({ tipo: 'error', texto: error.response?.data?.error || 'Error al registrar asistencia.' });
    }
  };

  const handleCancelarReservaAdmin = (reserva) => {
    setCancelModal(reserva);
    setCancelMotivo('');
  };

  const handleConfirmarCancelacion = async () => {
    try {
      await reservaService.cancelarReserva(cancelModal.id_reserva, cancelModal.usuario_id, cancelMotivo);
      setFeedbackMsg({ tipo: 'ok', texto: 'Reserva cancelada correctamente.' });
      setCancelModal(null);
      setCancelMotivo('');
      fetchReservas();
    } catch (error) {
      setFeedbackMsg({ tipo: 'error', texto: error.response?.data?.error || 'Error al cancelar la reserva.' });
    }
  };

  const handleLogout = async () => {
    await logoutUser();
    localStorage.clear();
    sessionStorage.clear();
    navigate("/");
  };

  const outletContext = {
    laboratorios, reservas, historialReservas,
    feedbackMsg, setFeedbackMsg,
    setReservaDetalleModal,
    handleCancelarReservaAdmin, handleAsistencia,
    fetchReservas, fetchLaboratorios, fetchHistorialReservas,
  };

  return (
    <div className="admin-layout">
      <aside className="sidebar">
        <div className="logo"><h2>LabSync</h2><p>UNTELS</p></div>
        <nav className="menu">
          <button className={`menu-title ${isActive('/admin/inicio') ? 'active' : ''}`} onClick={() => navigate('/admin/inicio')}>
            <Icon.Home /> <span>Inicio</span>
          </button>

          <div className="menu-section">
            <button className={`menu-title ${isActive('/admin/reservas') ? 'active' : ''}`} onClick={() => { setMostrarReservas(v => !v); navigate('/admin/reservas/hoy'); }}>
              <Icon.Calendar /> <span>Reservas</span>
            </button>
            {mostrarReservas && (
              <div className="submenu">
                <button className={location.pathname === '/admin/reservas/hoy' ? 'active' : ''} onClick={() => navigate('/admin/reservas/hoy')}>Hoy</button>
                <button className={location.pathname === '/admin/reservas/programadas' ? 'active' : ''} onClick={() => navigate('/admin/reservas/programadas')}>Programadas</button>
                <button className={location.pathname === '/admin/reservas/historial' ? 'active' : ''} onClick={() => navigate('/admin/reservas/historial')}>Historial</button>
              </div>
            )}
          </div>

          <div className="menu-section">
            <button className={`menu-title ${isActive('/admin/inventario') ? 'active' : ''}`} onClick={() => { setMostrarInventario(v => !v); navigate('/admin/inventario'); }}>
              <Icon.Package /> <span>Inventario</span>
            </button>
            {mostrarInventario && (
              <div className="submenu">
                <button className={location.pathname === '/admin/inventario' ? 'active-lab' : ''} onClick={() => navigate('/admin/inventario')}>Vista General</button>
                {laboratorios.map(lab => (
                  <button key={lab.id_laboratorio}
                    className={location.pathname === `/admin/inventario/${lab.id_laboratorio}` ? 'active-lab' : ''}
                    onClick={() => navigate(`/admin/inventario/${lab.id_laboratorio}`)}>
                    <span className={`dot ${lab.habilitado ? 'on' : 'off'}`} />
                    {lab.codigo_patrimonio || lab.nombre || `Lab ${lab.id_laboratorio}`}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button className={`menu-title ${isActive('/admin/usuarios') ? 'active' : ''}`} onClick={() => navigate('/admin/usuarios')}>
            <Icon.Users /> <span>Usuarios</span>
          </button>

          <button className={`menu-title ${isActive('/admin/visualizador') ? 'active' : ''}`} onClick={() => navigate('/admin/visualizador')}>
            <Icon.Calendar /> <span>Visualizador</span>
          </button>

          <div className="admin-theme-section" style={{ marginTop:'auto', padding:'20px 0' }}>
            <span style={{ fontSize:11,opacity:0.5,textTransform:'uppercase',letterSpacing:'1px',display:'block',marginBottom:10 }}>Apariencia</span>
            <ThemeToggle fixed={false} />
          </div>
          <button className="menu-title logout-btn" onClick={handleLogout}><Icon.Logout /><span>Cerrar Sesión</span></button>
        </nav>
      </aside>

      <main className="main-content">
        {feedbackMsg && (
          <div style={{ position:'fixed',top:20,right:20,zIndex:9999,padding:'12px 20px',borderRadius:8,maxWidth:380,
            background: feedbackMsg.tipo === 'ok' ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
            color: feedbackMsg.tipo === 'ok' ? '#10b981' : '#f87171',
            border: `1px solid ${feedbackMsg.tipo === 'ok' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
            boxShadow:'0 4px 12px rgba(0,0,0,0.15)' }}>
            {feedbackMsg.texto}
            <button onClick={() => setFeedbackMsg(null)} style={{ marginLeft:12,background:'none',border:'none',cursor:'pointer',fontWeight:700,color:'inherit' }}>×</button>
          </div>
        )}

        <Outlet context={outletContext} />

        {/* Reserva Detail Modal */}
        {reservaDetalleModal && (
          <div className="modal-overlay" onClick={() => setReservaDetalleModal(null)} style={{ display:'flex',alignItems:'flex-start',justifyContent:'center',overflowY:'auto',padding:'40px 20px' }}>
            <div className="modal-content modal-content--wide" onClick={e => e.stopPropagation()} style={{ maxWidth:800,width:'90%' }}>
              <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20,borderBottom:'1px solid var(--border-color)',paddingBottom:12 }}>
                <h2 style={{ margin:0 }}>Detalle de Reserva #{reservaDetalleModal.id_reserva}</h2>
                <button className="activo-drawer-close" onClick={() => setReservaDetalleModal(null)} style={{ position:'static' }}>×</button>
              </div>
              <div className="reserva-detail-grid" style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(280px, 1fr))',gap:20,marginBottom:20 }}>
                <div style={{ background:'var(--bg-main)',padding:16,borderRadius:8,border:'1px solid var(--border-color)' }}>
                  <h3 style={{ marginTop:0,borderBottom:'1px solid var(--border-color)',paddingBottom:8,color:'var(--accent-color)' }}>Información General</h3>
                  <div style={{ display:'flex',flexDirection:'column',gap:10,fontSize:14 }}>
                    <div><strong>Usuario:</strong> {reservaDetalleModal.usuario_nombre}</div>
                    <div><strong>Rol:</strong> <span className={`badge-rol ${reservaDetalleModal.usuario_rol?.toLowerCase()}`} style={{ fontSize:11,padding:'2px 8px' }}>{reservaDetalleModal.usuario_rol}</span></div>
                    <div><strong>Laboratorio:</strong> {reservaDetalleModal.laboratorio_nombre}</div>
                    <div><strong>Fecha:</strong> {reservaDetalleModal.fecha_reserva}</div>
                    <div><strong>Horario:</strong> {reservaDetalleModal.hora_inicio} - {reservaDetalleModal.hora_fin}</div>
                    <div><strong>Asientos:</strong> {reservaDetalleModal.cantidad_alumnos}</div>
                    <div><strong>Estado:</strong> <span className={`status-pill ${reservaDetalleModal.estado?.toLowerCase()}`} style={{ fontSize:11,padding:'2px 8px' }}>{reservaDetalleModal.estado}</span></div>
                  </div>
                </div>
                <div style={{ background:'var(--bg-main)',padding:16,borderRadius:8,border:'1px solid var(--border-color)' }}>
                  <h3 style={{ marginTop:0,borderBottom:'1px solid var(--border-color)',paddingBottom:8,color:'var(--accent-color)' }}>Equipos Reservados</h3>
                  {reservaDetalleModal.activos?.length > 0 ? (
                    <div style={{ display:'flex',flexDirection:'column',gap:8,maxHeight:160,overflowY:'auto',paddingRight:4 }}>
                      {reservaDetalleModal.activos.map(act => (
                        <div key={act.id_activo} style={{ display:'flex',justifyContent:'space-between',alignItems:'center',padding:'6px 10px',background:'rgba(59,130,246,0.08)',border:'1px solid rgba(59,130,246,0.2)',borderRadius:6,fontSize:13 }}>
                          <div><strong>{act.tipo_activo_nombre}:</strong> {act.codigo_patrimonio || 'Sin Código'}</div>
                          <small style={{ opacity:0.7 }}>Serie: {act.num_serie}</small>
                        </div>
                      ))}
                    </div>
                  ) : <p style={{ opacity:0.6,fontSize:13 }}>No hay equipos guardados.</p>}
                </div>
              </div>
              {reservaDetalleModal.historial_cambios?.length > 0 && (
                <div style={{ background:'var(--bg-main)',padding:16,borderRadius:8,border:'1px solid var(--border-color)',marginBottom:20 }}>
                  <h3 style={{ marginTop:0,borderBottom:'1px solid var(--border-color)',paddingBottom:8,color:'var(--accent-color)' }}>Historial de Estados</h3>
                  <div style={{ display:'flex',flexDirection:'column',gap:12,marginTop:12 }}>
                    {reservaDetalleModal.historial_cambios.map((log, i) => (
                      <div key={i} style={{ display:'flex',gap:12,fontSize:13,borderLeft:'2px solid var(--accent-color)',paddingLeft:12,position:'relative' }}>
                        <div style={{ position:'absolute',left:-6,top:4,width:10,height:10,borderRadius:'50%',background:'var(--accent-color)' }} />
                        <div style={{ flex:1 }}>
                          <div style={{ display:'flex',justifyContent:'space-between',fontWeight:600 }}>
                            <span>{log.estado_anterior} ➔ <span className={`status-pill ${log.estado_nuevo?.toLowerCase()}`} style={{ fontSize:10,padding:'1px 6px' }}>{log.estado_nuevo}</span></span>
                            <span style={{ opacity:0.6,fontSize:11 }}>{log.fecha_cambio}</span>
                          </div>
                          {log.observacion && <div style={{ marginTop:4,opacity:0.8,fontStyle:'italic',background:'rgba(255,255,255,0.02)',padding:'4px 8px',borderRadius:4 }}>💬 {log.observacion}</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div style={{ borderTop:'1px solid var(--border-color)',paddingTop:20 }}>
                <h3 style={{ marginTop:0,marginBottom:12 }}>Mapa de Ubicación Física</h3>
                {loadingDetalleMap ? (
                  <div style={{ textAlign:'center',padding:'30px 0',opacity:0.6,fontSize:14 }}>Cargando ubicación en mapa...</div>
                ) : detalleMapActivos.length > 0 ? (
                  <div style={{ border:'1px solid var(--border-color)',borderRadius:8,padding:12,background:'var(--bg-main)' }}>
                    <LabMap activos={detalleMapActivos} activoSel={(reservaDetalleModal.activos||[]).map(a => a.id_activo)} onSelect={() => {}} {...getLabLayout(reservaDetalleModal?.laboratorio?.codigo_patrimonio)} adminMode={false} />
                  </div>
                ) : <p style={{ opacity:0.6,fontSize:13,textAlign:'center',padding:'20px 0' }}>No se pudo cargar la grilla física del aula.</p>}
              </div>
              <div style={{ display:'flex',justifyContent:'flex-end',marginTop:24,borderTop:'1px solid var(--border-color)',paddingTop:16 }}>
                <button className="cancel-btn" onClick={() => setReservaDetalleModal(null)} style={{ margin:0,padding:'8px 20px' }}>Cerrar Vista</button>
              </div>
            </div>
          </div>
        )}

        {/* Cancel Confirmation Modal */}
        {cancelModal && (
          <div className="modal-overlay" onClick={() => setCancelModal(null)} style={{ display:'flex',alignItems:'center',justifyContent:'center',padding:'40px 20px' }}>
            <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth:480,width:'90%' }}>
              <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16,borderBottom:'1px solid var(--border-color)',paddingBottom:12 }}>
                <h2 style={{ margin:0,fontSize:18 }}>Cancelar Reserva</h2>
                <button className="activo-drawer-close" onClick={() => setCancelModal(null)} style={{ position:'static' }}>×</button>
              </div>
              <p style={{ margin:'0 0 20px 0',opacity:0.8 }}>¿Estás seguro de cancelar esta reserva? El estudiante/docente será notificado.</p>
              <div className="form-group" style={{ marginBottom:20 }}>
                <label>Motivo de cancelación <span style={{ color:'#dc2626' }}>*</span></label>
                <textarea className="search-input activo-motivo-txt" placeholder="Ej: Mantenimiento del laboratorio..." value={cancelMotivo} onChange={e => setCancelMotivo(e.target.value)} style={{ marginTop:8,minHeight:80,resize:'vertical',width:'100%',boxSizing:'border-box' }} />
              </div>
              <div style={{ display:'flex',gap:12,justifyContent:'flex-end' }}>
                <button className="cancel-btn" onClick={() => setCancelModal(null)}>Cancelar</button>
                <button className="delete-btn" onClick={handleConfirmarCancelacion} disabled={cancelMotivo.trim().length < 10} style={{ opacity: cancelMotivo.trim().length < 10 ? 0.4 : 1, cursor: cancelMotivo.trim().length < 10 ? 'not-allowed' : 'pointer' }}>
                  Confirmar cancelación
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default AdminLayout;
