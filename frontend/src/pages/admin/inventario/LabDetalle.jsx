import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useParams, useOutletContext } from "react-router-dom";
import laboratorioService from "../../../services/laboratorioService";
import LabMap from "../../../components/LabMap";
import { getLabLayout } from "../../../components/labLayoutConfig";

const Icon = {
  ChevronLeft: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>,
  Search:      () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  CPU:         () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="8" y="8" width="8" height="8"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="12" y1="1" x2="12" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="12" y1="20" x2="12" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/><line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="12" x2="4" y2="12"/><line x1="1" y1="15" x2="4" y2="15"/><line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="12" x2="23" y2="12"/><line x1="20" y1="15" x2="23" y2="15"/></svg>,
  Monitor:     () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>,
  Mesa:        () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="2" y="7" width="20" height="4" rx="1"/><line x1="5" y1="11" x2="5" y2="20"/><line x1="19" y1="11" x2="19" y2="20"/><line x1="12" y1="11" x2="12" y2="20"/></svg>,
  Default:     () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 9h6M9 12h6M9 15h4"/></svg>,
};

const colorActivo = (estado) => {
  if (estado === 'Operativo') return '#10b981';
  if (estado === 'Mantenimiento') return '#f59e0b';
  return '#dc2626';
};

const getActivoIcon = (tipo) => {
  if (!tipo) return <Icon.Default />;
  const t = tipo.toLowerCase();
  if (t.includes('cpu') || t.includes('pc') || t.includes('computad')) return <Icon.CPU />;
  if (t.includes('monitor')) return <Icon.Monitor />;
  if (t.includes('mesa')) return <Icon.Mesa />;
  return <Icon.Default />;
};

function AdminLabDetalle() {
  const { labId } = useParams();
  const navigate = useNavigate();
  const { laboratorios, fetchLaboratorios, setFeedbackMsg } = useOutletContext();

  const labSeleccionado = laboratorios.find(l => l.id_laboratorio === parseInt(labId));

  const [activos, setActivos]         = useState([]);
  const [historial, setHistorial]     = useState([]);
  const [activoModal, setActivoModal] = useState(null);
  const [cambioEstado, setCambioEstado] = useState({ estado: '', motivo: '' });
  const [cambioEstadoImagen, setCambioEstadoImagen] = useState(null);
  const [loadingActivos, setLoadingActivos] = useState(false);
  const [historialSearch, setHistorialSearch] = useState('');
  const [historialFiltro, setHistorialFiltro] = useState('todos');
  const [incidenciaModal, setIncidenciaModal] = useState(null);
  const [incidenciaDano, setIncidenciaDano]   = useState('');
  const [incidenciaEstado, setIncidenciaEstado] = useState('Mantenimiento');
  const [incidenciaImagen, setIncidenciaImagen] = useState(null);
  const [inhabilitarLabModal, setInhabilitarLabModal]   = useState(false);
  const [inhabilitarLabMotivo, setInhabilitarLabMotivo] = useState('');
  const [inhabilitarLabImagen, setInhabilitarLabImagen] = useState(null);
  const [perifericosEdit, setPerifericosEdit] = useState({});
  const currentLabIdRef = useRef(null);

  useEffect(() => { if (!incidenciaModal) setIncidenciaImagen(null); }, [incidenciaModal]);
  useEffect(() => { if (!inhabilitarLabModal) setInhabilitarLabImagen(null); }, [inhabilitarLabModal]);
  useEffect(() => { if (!activoModal) setCambioEstadoImagen(null); }, [activoModal]);

  const cargarDetalle = useCallback(async (lab) => {
    const thisLabId = lab.id_laboratorio;
    currentLabIdRef.current = thisLabId;

    setActivos([]);
    setHistorial([]);
    setActivoModal(null);
    setHistorialSearch('');
    setHistorialFiltro('todos');
    setLoadingActivos(true);

    try {
      const [activosData, historialData] = await Promise.all([
        laboratorioService.getActivosPorLab(lab.id_laboratorio),
        laboratorioService.getHistorialLab(lab.id_laboratorio),
      ]);

      // Si el usuario ya cambió a otro lab, descartar esta respuesta
      if (currentLabIdRef.current !== thisLabId) return;

      setActivos(activosData);
      setHistorial(historialData);
    } catch (err) {
      if (currentLabIdRef.current !== thisLabId) return;
      console.error(err);
    } finally {
      if (currentLabIdRef.current === thisLabId) {
        setLoadingActivos(false);
      }
    }
  }, []);

  useEffect(() => {
    if (labSeleccionado) cargarDetalle(labSeleccionado);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [labId, cargarDetalle]);

  const abrirModalActivo = (activo) => {
    setActivoModal(activo);
    if (activo) {
      setCambioEstado({ estado: activo.estado, motivo: '' });
      // Inicializar edición de periféricos vacía
      setPerifericosEdit({});
    }
  };

  const guardarCambioEstado = async () => {
    if (!cambioEstado.motivo.trim()) { setFeedbackMsg({ tipo:'error', texto:'El motivo es obligatorio.' }); return; }
    try {
      await laboratorioService.actualizarEstadoActivo(labSeleccionado.id_laboratorio, activoModal.id_activo, cambioEstado.estado, cambioEstado.motivo, cambioEstadoImagen);
      setFeedbackMsg({ tipo:'ok', texto:`Equipo actualizado a "${cambioEstado.estado}" correctamente.` });
      setActivoModal(null);
      await cargarDetalle(labSeleccionado);
      await fetchLaboratorios();
    } catch {
      setFeedbackMsg({ tipo:'error', texto:'Error al actualizar el equipo.' });
    }
  };

  const guardarIncidencia = async () => {
    if (!incidenciaDano.trim() || incidenciaDano.trim().length < 10) {
      setFeedbackMsg({ tipo:'error', texto:'La descripción del daño debe tener al menos 10 caracteres.' }); return;
    }
    try {
      const data = await laboratorioService.registrarIncidencia(labSeleccionado.id_laboratorio, incidenciaModal.id_activo, incidenciaDano, incidenciaEstado, incidenciaImagen);
      setFeedbackMsg({ tipo:'ok', texto: data.mensaje || 'Incidencia registrada con éxito.' });
      setIncidenciaModal(null); setIncidenciaDano(''); setIncidenciaEstado('Mantenimiento'); setActivoModal(null);
      await cargarDetalle(labSeleccionado);
      await fetchLaboratorios();
    } catch (err) {
      setFeedbackMsg({ tipo:'error', texto: err.response?.data?.error || 'Error al registrar la incidencia.' });
    }
  };

  const handleInhabilitarLaboratorio = async () => {
    if (!inhabilitarLabMotivo.trim()) { setFeedbackMsg({ tipo:'error', texto:'El motivo es obligatorio.' }); return; }
    try {
      const adminId = localStorage.getItem('userId') || localStorage.getItem('id_usuario');
      const data = await laboratorioService.inhabilitarLaboratorio(labSeleccionado.id_laboratorio, inhabilitarLabMotivo, adminId, inhabilitarLabImagen);
      setFeedbackMsg({ tipo:'ok', texto: data.mensaje || 'Laboratorio inhabilitado con éxito.' });
      setInhabilitarLabModal(false); setInhabilitarLabMotivo('');
      await fetchLaboratorios();
    } catch (err) {
      setFeedbackMsg({ tipo:'error', texto: err.response?.data?.error || 'Error al inhabilitar el laboratorio.' });
    }
  };

  const handleHabilitarLaboratorio = async () => {
    try {
      const data = await laboratorioService.habilitarLaboratorio(labSeleccionado.id_laboratorio);
      setFeedbackMsg({ tipo:'ok', texto: data.mensaje || 'Laboratorio habilitado con éxito.' });
      await fetchLaboratorios();
    } catch (err) {
      setFeedbackMsg({ tipo:'error', texto: err.response?.data?.error || 'Error al habilitar el laboratorio.' });
    }
  };

  const guardarCambioPeriferico = async (periferico, edit) => {
    if (!edit.motivo.trim()) {
      setFeedbackMsg({ tipo:'error', texto:'El motivo es obligatorio.' });
      return;
    }
    try {
      await laboratorioService.actualizarEstadoActivo(
        labSeleccionado.id_laboratorio,
        periferico.id_activo,
        edit.estado,
        edit.motivo,
        null
      );
      setFeedbackMsg({
        tipo:'ok',
        texto:`${periferico.tipo_activo_nombre} actualizado a "${edit.estado}".`
      });
      // Limpiar edición de este periférico
      setPerifericosEdit(prev => {
        const n = {...prev};
        delete n[periferico.id_activo];
        return n;
      });
      // Recargar activos y laboratorios
      await cargarDetalle(labSeleccionado);
      await fetchLaboratorios();
    } catch {
      setFeedbackMsg({
        tipo:'error',
        texto:`Error al actualizar ${periferico.tipo_activo_nombre}.`
      });
    }
  };

  if (!labSeleccionado) {
    return (
      <div className="table-section">
        <button onClick={() => navigate('/admin/inventario')} style={{ background:'var(--bg-input)',border:'1px solid var(--border-color)',borderRadius:8,padding:'6px 12px',color:'var(--text-muted)',cursor:'pointer',display:'flex',alignItems:'center',gap:4 }}>
          <Icon.ChevronLeft /> Volver
        </button>
        <p style={{ opacity:0.6,marginTop:20 }}>Laboratorio no encontrado.</p>
      </div>
    );
  }

  const filtrados = historial.filter(h => {
    const q = (historialSearch || '').toLowerCase();
    const matchSearch = !q || (h.activo_serie||'').toLowerCase().includes(q) || (h.activo_tipo||'').toLowerCase().includes(q) || (h.motivo||'').toLowerCase().includes(q) || (h.registrado_por_nombre||'').toLowerCase().includes(q);
    const matchFiltro = !historialFiltro || historialFiltro === 'todos' || h.estado_nuevo === historialFiltro;
    return matchSearch && matchFiltro;
  });

  const rolColor = (rol) => {
    if (!rol) return { bg:'rgba(107,114,128,0.15)',color:'#6b7280' };
    const r = rol.toLowerCase();
    if (r.includes('admin')) return { bg:'rgba(37,99,235,0.15)',color:'#3b82f6' };
    if (r.includes('docente')) return { bg:'rgba(245,158,11,0.15)',color:'#f59e0b' };
    return { bg:'rgba(107,114,128,0.15)',color:'#6b7280' };
  };

  return (
    <div className="table-section">
      {/* Header */}
      <div style={{ display:'flex',alignItems:'center',gap:16,marginBottom:24,flexWrap:'wrap' }}>
        <button onClick={() => navigate('/admin/inventario')} style={{ background:'var(--bg-input)',border:'1px solid var(--border-color)',borderRadius:8,padding:'6px 12px',color:'var(--text-muted)',cursor:'pointer',display:'flex',alignItems:'center',gap:4,transition:'0.2s' }}>
          <Icon.ChevronLeft /> Volver
        </button>
        <div style={{ background: labSeleccionado.habilitado ? '#d1fae5' : '#fee2e2', color: labSeleccionado.habilitado ? '#065f46' : '#7f1d1d', border:`1px solid ${labSeleccionado.habilitado ? '#6ee7b7' : '#fca5a5'}`, borderRadius:20,padding:'6px 16px',fontWeight:600,fontSize:13 }}>
          {labSeleccionado.habilitado ? 'HABILITADO' : 'INHABILITADO'}
        </div>
        {labSeleccionado.habilitado && (
          <button onClick={() => setInhabilitarLabModal(true)} style={{ background:'#fee2e2',color:'#dc2626',border:'1px solid #fca5a5',borderRadius:8,padding:'6px 12px',fontWeight:600,fontSize:13,cursor:'pointer',display:'flex',alignItems:'center',gap:6 }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:14,height:14}}><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
            Dar de baja aula
          </button>
        )}
        {!labSeleccionado.habilitado && (
          <button onClick={handleHabilitarLaboratorio} style={{ background:'#d1fae5',color:'#059669',border:'1px solid #6ee7b7',borderRadius:8,padding:'6px 12px',fontWeight:600,fontSize:13,cursor:'pointer',display:'flex',alignItems:'center',gap:6 }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:14,height:14}}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            Habilitar aula
          </button>
        )}
        <div style={{ flex:1 }}>
          <strong>{labSeleccionado.nombre}</strong>
          <span style={{ opacity:0.6,fontSize:13,marginLeft:10 }}>{labSeleccionado.codigo_patrimonio} · Aforo: {labSeleccionado.aforo_maximo} · Tipo: {labSeleccionado.tipo_nombre}</span>
        </div>
        <div style={{ fontSize:13 }}>
          Equipos Operativos: <strong style={{ color:'#10b981' }}>{activos.filter(a => (a.tipo_activo_nombre === 'CPU' || a.tipo_activo_nombre === 'Mesa') && a.estado === 'Operativo').length}</strong> / {labSeleccionado.aforo_maximo}
        </div>
      </div>

      {/* LabMap */}
      {loadingActivos ? (
        <div style={{ textAlign:'center',padding:40,opacity:0.6 }}>Cargando equipos...</div>
      ) : (
        <div style={{ marginBottom:32 }}>
          {activos.length > 0 ? (
            <div style={!labSeleccionado.habilitado ? { opacity:0.5,filter:'grayscale(100%)',pointerEvents:'none' } : {}}>
              <LabMap activos={activos} activoSel={activoModal} onSelect={abrirModalActivo} {...getLabLayout(labSeleccionado?.codigo_patrimonio)} adminMode={true} />
            </div>
          ) : <p style={{ opacity:0.6 }}>No hay equipos registrados.</p>}
        </div>
      )}

      {/* Historial */}
      {historial.length > 0 && (
        <>
          <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12,flexWrap:'wrap',gap:10 }}>
            <h3 style={{ margin:0 }}>
              Historial de Mantenimiento
              <span style={{ fontSize:12,opacity:0.5,fontWeight:400,marginLeft:8 }}>{filtrados.length} registro{filtrados.length !== 1 ? 's' : ''}</span>
            </h3>
            <div style={{ display:'flex',gap:10,alignItems:'center',flexWrap:'wrap' }}>
              <div className="search-group" style={{ width:220 }}>
                <Icon.Search />
                <input type="text" placeholder="Buscar equipo, motivo..." className="search-input" value={historialSearch} onChange={e => setHistorialSearch(e.target.value)} />
              </div>
              <select className="filter-select" value={historialFiltro} onChange={e => setHistorialFiltro(e.target.value)}>
                <option value="todos">Todos los estados</option>
                <option value="Operativo">→ Operativo</option>
                <option value="Mantenimiento">→ Mantenimiento</option>
                <option value="Dado de baja">→ Dado de baja</option>
              </select>
            </div>
          </div>
          <table>
            <thead>
              <tr><th>Tipo</th><th>Equipo (Serie)</th><th>Anterior</th><th>Nuevo</th><th>Motivo</th><th>Fecha</th><th>Registrado por</th></tr>
            </thead>
            <tbody>
              {filtrados.length === 0 ? (
                <tr><td colSpan="7" style={{ textAlign:'center',opacity:0.5 }}>Sin resultados.</td></tr>
              ) : filtrados.slice(0, 25).map(h => {
                const rc = rolColor(h.registrado_por_rol);
                return (
                  <tr key={h.id_historial}>
                    <td><span style={{ display:'flex',alignItems:'center',gap:6 }}><span style={{ color:colorActivo(h.estado_nuevo),flexShrink:0 }}>{getActivoIcon(h.activo_tipo)}</span><span style={{ fontSize:12,opacity:0.7 }}>{h.activo_tipo || '—'}</span></span></td>
                    <td style={{ fontFamily:'monospace',fontSize:12 }}>{h.activo_serie}</td>
                    <td><span style={{ color:colorActivo(h.estado_anterior),fontWeight:600 }}>{h.estado_anterior}</span></td>
                    <td><span style={{ color:colorActivo(h.estado_nuevo),fontWeight:600 }}>{h.estado_nuevo}</span></td>
                    <td style={{ maxWidth:180,wordBreak:'break-word',fontSize:13 }}>{h.motivo || '—'}</td>
                    <td style={{ fontSize:12,opacity:0.8 }}>{new Date(h.fecha_cambio).toLocaleString('es-PE')}</td>
                    <td>
                      <div style={{ display:'flex',flexDirection:'column',gap:3 }}>
                        <span style={{ fontSize:13 }}>{h.registrado_por_nombre || '—'}</span>
                        {h.registrado_por_rol && <span style={{ fontSize:10,fontWeight:700,padding:'1px 7px',borderRadius:10,background:rc.bg,color:rc.color,textTransform:'uppercase',letterSpacing:'0.5px',alignSelf:'flex-start' }}>{h.registrado_por_rol}</span>}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtrados.length > 25 && <p style={{ fontSize:12,opacity:0.5,marginTop:8,textAlign:'center' }}>Mostrando 25 de {filtrados.length}.</p>}
        </>
      )}

      {/* Activo Drawer Overlay */}
      {activoModal && <div className="activo-drawer-overlay" onClick={() => setActivoModal(null)} />}
      <aside className={`activo-drawer${activoModal ? ' activo-drawer--open' : ''}`}>
        {activoModal && (
          <>
            <div className="activo-drawer-header">
              <div className="activo-drawer-icon-wrap" style={{ background:`${colorActivo(activoModal.estado)}22`,color:colorActivo(activoModal.estado) }}>{getActivoIcon(activoModal.tipo_activo_nombre)}</div>
              <div className="activo-drawer-title">
                <h3>{activoModal.tipo_activo_nombre || 'Equipo'}</h3>
                <span className={`activo-drawer-badge activo-badge--${(activoModal.estado||'').toLowerCase().replace(/ /g,'-')}`}>{activoModal.estado}</span>
              </div>
              <button className="activo-drawer-close" onClick={() => setActivoModal(null)} title="Cerrar">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className="activo-drawer-body">
              <div className="activo-info-grid">
                {[['Código Patrimonio', activoModal.codigo_patrimonio||'—'], ['N° de Serie', activoModal.num_serie||'—'], ['Categoría', activoModal.categoria_nombre||'—']].map(([lbl, val]) => (
                  <div key={lbl} className="activo-info-item"><span className="activo-info-label">{lbl}</span><strong className="activo-info-val">{val}</strong></div>
                ))}
                <div className="activo-info-item"><span className="activo-info-label">Estado actual</span><span style={{ color:colorActivo(activoModal.estado),fontWeight:700 }}>{activoModal.estado}</span></div>
              </div>
              {(() => {
                const puestoNum = activoModal.num_serie?.split('-').slice(-1)[0];
                if (!puestoNum) return null;
                const hermanos = activos.filter(a => a.id_activo !== activoModal.id_activo && a.num_serie?.endsWith(`-${puestoNum}`));
                if (!hermanos.length) return null;
                return (
                  <div style={{ marginBottom:16 }}>
                    <div className="activo-drawer-divider">
                      Periféricos del Puesto #{puestoNum}
                    </div>
                    <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                      {hermanos.map(h => {
                        const edit = perifericosEdit[h.id_activo];
                        const estadoActual = edit?.estado ?? h.estado;
                        return (
                          <div key={h.id_activo} style={{
                            background:'var(--bg-main)',
                            border:'1px solid var(--border-color)',
                            borderRadius:8, padding:10
                          }}>
                            {/* Cabecera del periférico */}
                            <div style={{ display:'flex', justifyContent:'space-between',
                                          alignItems:'center', marginBottom: edit ? 8 : 0 }}>
                              <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                                <span style={{ color:colorActivo(estadoActual) }}>
                                  {getActivoIcon(h.tipo_activo_nombre)}
                                </span>
                                <span style={{ fontWeight:600, fontSize:13 }}>
                                  {h.tipo_activo_nombre}
                                </span>
                                <span style={{ fontSize:11, opacity:0.6 }}>
                                  {h.num_serie}
                                </span>
                              </div>
                              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                                <span style={{
                                  fontSize:11, fontWeight:700,
                                  color:colorActivo(estadoActual)
                                }}>
                                  {estadoActual}
                                </span>
                                {!edit ? (
                                  <button
                                    onClick={() => setPerifericosEdit(prev => ({
                                      ...prev,
                                      [h.id_activo]: { estado: h.estado, motivo: '' }
                                    }))}
                                    style={{
                                      fontSize:11, padding:'2px 8px', borderRadius:6,
                                      border:'1px solid var(--border-color)',
                                      background:'var(--bg-input)',
                                      color:'var(--text-main)', cursor:'pointer'
                                    }}
                                  >
                                    Editar
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => setPerifericosEdit(prev => {
                                      const n = {...prev}; delete n[h.id_activo]; return n;
                                    })}
                                    style={{
                                      fontSize:11, padding:'2px 8px', borderRadius:6,
                                      border:'none', background:'transparent',
                                      color:'var(--text-muted)', cursor:'pointer'
                                    }}
                                  >
                                    ✕ Cancelar
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Formulario inline de edición */}
                            {edit && (
                              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                                <div style={{ display:'flex', gap:6 }}>
                                  {['Operativo','Mantenimiento','Dado de baja'].map(est => (
                                    <button key={est}
                                      onClick={() => setPerifericosEdit(prev => ({
                                        ...prev,
                                        [h.id_activo]: { ...prev[h.id_activo], estado: est }
                                      }))}
                                      style={{
                                        flex:1, fontSize:10, padding:'4px 2px',
                                        borderRadius:6, border:`1px solid ${
                                          edit.estado === est
                                            ? colorActivo(est)
                                            : 'var(--border-color)'
                                        }`,
                                        background: edit.estado === est
                                          ? `${colorActivo(est)}22`
                                          : 'var(--bg-input)',
                                        color: edit.estado === est
                                          ? colorActivo(est)
                                          : 'var(--text-muted)',
                                        cursor:'pointer', fontWeight:600
                                      }}
                                    >
                                      {est}
                                    </button>
                                  ))}
                                </div>
                                <textarea
                                  placeholder="Motivo del cambio (obligatorio)..."
                                  value={edit.motivo}
                                  onChange={e => setPerifericosEdit(prev => ({
                                    ...prev,
                                    [h.id_activo]: { ...prev[h.id_activo], motivo: e.target.value }
                                  }))}
                                  style={{
                                    width:'100%', padding:'6px 10px', borderRadius:6,
                                    border:'1px solid var(--border-color)',
                                    background:'var(--bg-input)', color:'var(--text-main)',
                                    fontSize:12, resize:'vertical', minHeight:50,
                                    boxSizing:'border-box'
                                  }}
                                />
                                <button
                                  disabled={!edit.motivo.trim()}
                                  onClick={() => guardarCambioPeriferico(h, edit)}
                                  style={{
                                    padding:'6px 12px', borderRadius:6, border:'none',
                                    background: !edit.motivo.trim()
                                      ? 'rgba(99,102,241,0.3)'
                                      : colorActivo(edit.estado),
                                    color:'#fff', fontWeight:600, fontSize:12,
                                    cursor: !edit.motivo.trim() ? 'not-allowed' : 'pointer',
                                    opacity: !edit.motivo.trim() ? 0.6 : 1
                                  }}
                                >
                                  Guardar cambio
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
              <div className="activo-drawer-divider">Cambiar estado del equipo</div>
              <div className="activo-estado-btns">
                {['Operativo', 'Mantenimiento', 'Dado de baja'].map(est => (
                  <button key={est} className={`activo-estado-btn${cambioEstado.estado === est ? ' activo-estado-btn--active' : ''}`} style={cambioEstado.estado === est ? { background:colorActivo(est),color:'#fff',borderColor:colorActivo(est) } : {}} onClick={() => setCambioEstado({ ...cambioEstado, estado:est })}>
                    <span className="activo-estado-dot" style={{ background:colorActivo(est) }} />{est}
                  </button>
                ))}
              </div>
              <div className="form-group" style={{ marginTop:20 }}>
                <label>Motivo del cambio <span style={{ color:'#dc2626' }}>*</span></label>
                <textarea className="search-input activo-motivo-txt" placeholder="Describe el motivo del cambio de estado..." value={cambioEstado.motivo} onChange={e => setCambioEstado({ ...cambioEstado, motivo:e.target.value })} />
              </div>
              <div className="form-group" style={{ marginTop:12 }}>
                <label style={{ fontSize:13 }}>Imagen de evidencia <small style={{ fontWeight:400,opacity:0.65 }}>(opcional)</small></label>
                <input type="file" accept="image/*" onChange={e => setCambioEstadoImagen(e.target.files[0]||null)} style={{ width:'100%',marginTop:6,padding:'8px 10px',borderRadius:8,border:'1px solid var(--border-color)',background:'var(--bg-input)',color:'var(--text-main)',fontSize:13,boxSizing:'border-box' }} />
                {cambioEstadoImagen && <small style={{ display:'block',marginTop:4,opacity:0.6,fontSize:11 }}>{cambioEstadoImagen.name}</small>}
              </div>
              <div className="activo-drawer-actions" style={{ display:'flex',flexDirection:'column',gap:10 }}>
                <div style={{ display:'flex',gap:10,width:'100%' }}>
                  <button className="cancel-btn" onClick={() => setActivoModal(null)} style={{ flex:1 }}>Cancelar</button>
                  <button className="save-btn" onClick={guardarCambioEstado} style={{ background:colorActivo(cambioEstado.estado),flex:1 }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:16,height:16}}><polyline points="20 6 9 17 4 12"/></svg>
                    Guardar Cambio
                  </button>
                </div>
                <button className="report-btn" onClick={() => { setIncidenciaModal(activoModal); setIncidenciaDano(''); setIncidenciaEstado('Mantenimiento'); }} style={{ width:'100%',background:'#dc2626',color:'#fff',border:'none',padding:'10px 16px',borderRadius:8,fontWeight:600,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:8 }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:16,height:16}}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                  Reportar Incidencia (Daño)
                </button>
              </div>
            </div>
          </>
        )}
      </aside>

      {/* Incidencia Modal */}
      {incidenciaModal && (
        <div className="modal-overlay" onClick={() => setIncidenciaModal(null)} style={{ display:'flex',alignItems:'center',justifyContent:'center',padding:'40px 20px',zIndex:1100 }}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth:480,width:'90%' }}>
            <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16,borderBottom:'1px solid var(--border-color)',paddingBottom:12 }}>
              <h2 style={{ margin:0,fontSize:18,color:'#dc2626',display:'flex',alignItems:'center',gap:8 }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:20,height:20}}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                Reportar Incidencia
              </h2>
              <button className="activo-drawer-close" onClick={() => setIncidenciaModal(null)} style={{ position:'static' }}>×</button>
            </div>
            <p style={{ margin:'0 0 16px 0',fontSize:14,opacity:0.8 }}>Registra un daño para el equipo <strong>{incidenciaModal.num_serie}</strong> (Patrimonio: {incidenciaModal.codigo_patrimonio||'—'}).</p>
            <div className="form-group" style={{ marginBottom:16 }}>
              <label style={{ display:'block',marginBottom:6,fontWeight:600,fontSize:13 }}>Descripción del daño <span style={{ color:'#dc2626' }}>*</span></label>
              <textarea className="search-input" placeholder="Ej: Teclado roto, monitor parpadea..." value={incidenciaDano} onChange={e => setIncidenciaDano(e.target.value)} style={{ minHeight:90,resize:'vertical',width:'100%',boxSizing:'border-box',padding:10,borderRadius:8,border:'1px solid var(--border-color)',background:'var(--bg-input)',color:'var(--text-main)' }} />
              <small style={{ display:'block',marginTop:4,opacity:0.6,fontSize:11 }}>Mínimo 10 caracteres. {incidenciaDano.trim().length}/10</small>
            </div>
            <div className="form-group" style={{ marginBottom:16 }}>
              <label style={{ display:'block',marginBottom:6,fontWeight:600,fontSize:13 }}>Estado resultante <span style={{ color:'#dc2626' }}>*</span></label>
              <select className="filter-select" value={incidenciaEstado} onChange={e => setIncidenciaEstado(e.target.value)} style={{ width:'100%',padding:'10px 14px',borderRadius:8,border:'1px solid var(--border-color)',background:'var(--bg-input)',color:'var(--text-main)' }}>
                <option value="Mantenimiento">Mantenimiento</option>
                <option value="Dado de baja">Dado de baja</option>
              </select>
            </div>
            <div className="form-group" style={{ marginBottom:24 }}>
              <label style={{ display:'block',marginBottom:6,fontWeight:600,fontSize:13 }}>Imagen de evidencia <small style={{ fontWeight:400,opacity:0.65 }}>(opcional)</small></label>
              <input type="file" accept="image/*" onChange={e => setIncidenciaImagen(e.target.files[0]||null)} style={{ width:'100%',padding:'8px 10px',borderRadius:8,border:'1px solid var(--border-color)',background:'var(--bg-input)',color:'var(--text-main)',fontSize:13,boxSizing:'border-box' }} />
              {incidenciaImagen && <small style={{ display:'block',marginTop:4,opacity:0.6,fontSize:11 }}>{incidenciaImagen.name}</small>}
            </div>
            <div style={{ display:'flex',gap:12,justifyContent:'flex-end' }}>
              <button className="cancel-btn" onClick={() => setIncidenciaModal(null)} style={{ padding:'8px 16px' }}>Cancelar</button>
              <button className="save-btn" onClick={guardarIncidencia} disabled={incidenciaDano.trim().length < 10} style={{ background:'#dc2626',opacity: incidenciaDano.trim().length < 10 ? 0.5 : 1,cursor: incidenciaDano.trim().length < 10 ? 'not-allowed' : 'pointer',padding:'8px 16px',color:'#fff',border:'none',borderRadius:8,fontWeight:600 }}>
                Registrar Incidencia
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Inhabilitar Lab Modal */}
      {inhabilitarLabModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth:450 }}>
            <div className="modal-header"><h2>Dar de baja {labSeleccionado.nombre}</h2><button className="close-modal" onClick={() => setInhabilitarLabModal(false)}>&times;</button></div>
            <div className="modal-body" style={{ display:'flex',flexDirection:'column',gap:16 }}>
              <div style={{ background:'#fee2e2',color:'#991b1b',padding:'12px 16px',borderRadius:8,fontSize:14,lineHeight:1.5 }}><strong>⚠️ ¡Atención!</strong> Al dar de baja este laboratorio, se <strong>cancelarán automáticamente</strong> todas las reservas futuras programadas.</div>
              <div>
                <label style={{ fontWeight:600,display:'block',marginBottom:6 }}>Motivo de la baja <span style={{ color:'#dc2626' }}>*</span></label>
                <textarea placeholder="Ej. Problemas eléctricos en todo el salón..." value={inhabilitarLabMotivo} onChange={e => setInhabilitarLabMotivo(e.target.value)} style={{ width:'100%',padding:'10px 14px',borderRadius:8,border:'1px solid var(--border-color)',minHeight:90,resize:'vertical',background:'var(--bg-input)',color:'var(--text-main)' }} />
              </div>
              <div>
                <label style={{ fontWeight:600,display:'block',marginBottom:6 }}>Imagen de evidencia <small style={{ fontWeight:400,opacity:0.65 }}>(opcional)</small></label>
                <input type="file" accept="image/*" onChange={e => setInhabilitarLabImagen(e.target.files[0]||null)} style={{ width:'100%',padding:'8px 10px',borderRadius:8,border:'1px solid var(--border-color)',background:'var(--bg-input)',color:'var(--text-main)',fontSize:13,boxSizing:'border-box' }} />
                {inhabilitarLabImagen && <small style={{ display:'block',marginTop:4,opacity:0.6,fontSize:11 }}>{inhabilitarLabImagen.name}</small>}
              </div>
              <div style={{ display:'flex',gap:12,justifyContent:'flex-end',marginTop:10 }}>
                <button className="cancel-btn" onClick={() => setInhabilitarLabModal(false)} style={{ padding:'8px 16px' }}>Cancelar</button>
                <button className="save-btn" onClick={handleInhabilitarLaboratorio} disabled={!inhabilitarLabMotivo.trim()} style={{ background:'#dc2626',opacity: !inhabilitarLabMotivo.trim() ? 0.5 : 1,cursor: !inhabilitarLabMotivo.trim() ? 'not-allowed' : 'pointer',padding:'8px 16px',color:'#fff',border:'none',borderRadius:8,fontWeight:600 }}>
                  Confirmar Baja
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminLabDetalle;
