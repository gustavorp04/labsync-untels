import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import laboratorioService from "../../services/laboratorioService";
import reservaService from "../../services/reservaService";
import { logoutUser } from "../../services/auth";
import LabMap from "../../components/LabMap";
import ThemeToggle from "../../components/ThemeToggle";
import "./Estudiante.css";

/* ─── Icons ─── */
const Icon = {
  Home:    () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  Book:    () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>,
  List:    () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>,
  Logout:  () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  Clock:   () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  Shield:  () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  Check:   () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>,
  ChevronLeft: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>,
  Alert:   () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
  Search:  () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  Sun:     () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>,
  Moon:    () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>,
};

function StatusBadge({ estado }) {
  const cfg = {
    Programada: { bg: '#dbeafe', color: '#1d4ed8', dot: '#3b82f6' },
    Pendiente:  { bg: '#fef3c7', color: '#92400e', dot: '#f59e0b' },
    Completada: { bg: '#d1fae5', color: '#065f46', dot: '#10b981' },
    Cancelada:  { bg: '#fee2e2', color: '#991b1b', dot: '#ef4444' },
    'No-Show':   { bg: '#f3f4f6', color: '#6b7280', dot: '#9ca3af' },
  }[estado] || { bg: '#f3f4f6', color: '#374151', dot: '#9ca3af' };
  return (
    <span style={{ background: cfg.bg, color: cfg.color, padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
      <span style={{ width: 7, height: 7, borderRadius: '50%', background: cfg.dot }} />
      {estado}
    </span>
  );
}

function Estudiante() {
  const navigate = useNavigate();
  // Persistencia de sesión (Sobrevivir a F5)
  const [vista, setVista]         = useState(() => sessionStorage.getItem("est_vista") || "inicio");
  const [paso, setPaso]           = useState(() => parseInt(sessionStorage.getItem("est_paso")) || 1);
  const [toast, setToast]         = useState(null);
  
  // Guardado automático del estado al cambiar
  useEffect(() => { sessionStorage.setItem("est_vista", vista); }, [vista]);
  useEffect(() => { sessionStorage.setItem("est_paso", paso.toString()); }, [paso]);

  // Data
  const [laboratorios, setLaboratorios] = useState([]);
  const [horarios, setHorarios]         = useState([]);
  const [activos, setActivos]           = useState([]);
  const [misReservas, setMisReservas]   = useState([]);
  const [loading, setLoading]           = useState(false);

  // Selection (Persistencia profunda para resistir F5 en medio de reserva)
  const [labSel, setLabSel]         = useState(() => JSON.parse(sessionStorage.getItem("est_labSel")) || null);
  const [horarioSel, setHorarioSel] = useState(() => JSON.parse(sessionStorage.getItem("est_horarioSel")) || null);
  const [activoSel, setActivoSel]   = useState(() => JSON.parse(sessionStorage.getItem("est_activoSel")) || null);
  const [labSearchTerm, setLabSearchTerm] = useState("");

  const activoSelRef = useRef(activoSel);
  useEffect(() => {
    activoSelRef.current = activoSel;
  }, [activoSel]);

  // M-1: ref para el timer del toast (evita memory leak al cambiar vista o desmontar)
  const toastTimerRef = useRef(null);

  useEffect(() => { sessionStorage.setItem("est_labSel", JSON.stringify(labSel)); }, [labSel]);
  useEffect(() => { sessionStorage.setItem("est_horarioSel", JSON.stringify(horarioSel)); }, [horarioSel]);
  useEffect(() => { sessionStorage.setItem("est_activoSel", JSON.stringify(activoSel)); }, [activoSel]);

  // DJ
  const [aceptaDJ, setAceptaDJ]   = useState(false);
  const [showDJ, setShowDJ]       = useState(false);

  // Detalle de reserva modal
  const [reservaDetalle, setReservaDetalle] = useState(null);

  // User Data (Normalizada para compatibilidad)
  const userId   = localStorage.getItem("id_usuario") || "";
  const nombre   = localStorage.getItem("nombre") || localStorage.getItem("username") || "Estudiante";
  const ciclo    = localStorage.getItem("ciclo") || "";
  const carrera  = localStorage.getItem("carrera") || "";

  // Normalización para filtros (PBI-04)
  const normalize = useCallback((str) => (str || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""), []);
  const carreraNorm = useMemo(() => normalize(carrera), [carrera, normalize]);
  
  const tiposEspecialidad = useMemo(() => {
    if (carreraNorm.includes('sist')) return ['computo'];
    if (carreraNorm.includes('amb'))  return ['ambiental'];
    if (carreraNorm.includes('elec')) return ['electronica'];
    return [];
  }, [carreraNorm]);

  const tiposPermitidos = useMemo(() => [...tiposEspecialidad, 'fisica'], [tiposEspecialidad]);

  // M-1: useCallback estable + ref para no dejar timers huérfanos
  const showToast = useCallback((tipo, texto, dur = 5000) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ tipo, texto });
    toastTimerRef.current = setTimeout(() => setToast(null), dur);
  }, []);

  // M-1: limpieza al desmontar
  useEffect(() => () => { if (toastTimerRef.current) clearTimeout(toastTimerRef.current); }, []);

  // M-2: acepta signal para cancelar la petición si el efecto se desmonta antes de recibir respuesta
  const fetchMisReservas = useCallback(async (signal) => {
    if (!userId) return;
    try {
      const data = await reservaService.getMisReservas(userId, { signal });
      setMisReservas(data);
    } catch (err) {
      if (err.name !== 'CanceledError' && err.code !== 'ERR_CANCELED') console.error(err);
    }
  }, [userId]);

  // PROTECCIÓN ANTI-PANTALLA BLANCA (F5 Crash Fix)
  useEffect(() => {
    if (vista === 'nueva-reserva') {
      if (paso === 2 && !labSel) setPaso(1);
      if (paso === 3 && (!labSel || !horarioSel)) setPaso(1);
      if (paso === 4 && (!labSel || !horarioSel || !activoSel)) setPaso(1);
    }
  }, [vista, paso, labSel, horarioSel, activoSel]);

  // M-2: AbortController para cancelar requests en vuelo al cambiar de vista
  useEffect(() => {
    const abortCtrl = new AbortController();
    let intervalId = null;
    if (vista === 'mis-reservas') {
      fetchMisReservas(abortCtrl.signal);
      intervalId = setInterval(() => fetchMisReservas(abortCtrl.signal), 10000);
    }
    if (vista === 'nueva-reserva') {
      setLoading(true);
      // ID-07: el filtro por carrera ahora lo aplica el servidor mediante ?tipo_nombres=
      // No hay lógica de filtrado en el cliente que pueda ser bypasseada.
      laboratorioService.getLaboratorios(tiposPermitidos, { signal: abortCtrl.signal })
        .then(data => setLaboratorios(data))
        .catch((err) => {
          if (err.name !== 'CanceledError' && err.code !== 'ERR_CANCELED') showToast('error', 'Error al cargar laboratorios');
        })
        .finally(() => setLoading(false));
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
      abortCtrl.abort();
    };
  }, [vista, carreraNorm, fetchMisReservas, tiposPermitidos, tiposEspecialidad.length, normalize]);

  // Carga de horarios en Paso 2
  useEffect(() => {
    if (paso === 2 && labSel) {
      setLoading(true);
      reservaService.getHorariosPorLab(labSel.id_laboratorio)
        .then(data => setHorarios(data))
        .catch(() => showToast('error', 'Error al cargar horarios'))
        .finally(() => setLoading(false));
    }
  }, [paso, labSel]);

  // Carga y Polling reactivo en tiempo real de equipos en Paso 3
  // M-2: AbortController para cancelar requests huérfanos al salir del paso
  useEffect(() => {
    let intervalId = null;
    const abortCtrl = new AbortController();

    if (paso === 3 && labSel && horarioSel) {
      const cargarEquipos = async (showLoading = false) => {
        if (showLoading) setLoading(true);
        try {
          const data = await laboratorioService.getActivosPorLab(
            labSel.id_laboratorio, horarioSel.id_horario, { signal: abortCtrl.signal }
          );
          setActivos(data);

          // Verificar si el equipo seleccionado por el estudiante fue ocupado o inhabilitado por otro
          if (activoSelRef.current) {
            const pcActualizada = data.find(a => a.id_activo === activoSelRef.current.id_activo);
            if (
              pcActualizada &&
              (pcActualizada.reservado ||
               pcActualizada.estado_reserva === "Pendiente" ||
               pcActualizada.estado !== "Operativo")
            ) {
              setActivoSel(null);
              showToast('error', 'El equipo seleccionado ha sido reservado o inhabilitado por otro usuario.');
            }
          }
        } catch (err) {
          if (err.name !== 'CanceledError' && err.code !== 'ERR_CANCELED') {
            console.error("Error al refrescar equipos:", err);
          }
        } finally {
          if (showLoading) setLoading(false);
        }
      };

      // Carga inicial con spinner
      cargarEquipos(true);

      // Polling en segundo plano cada 3 segundos (actualización silenciosa)
      intervalId = setInterval(() => cargarEquipos(false), 3000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
      abortCtrl.abort();
    };
  }, [paso, labSel, horarioSel]);

  const handleSubmitReserva = async () => {
    if (!aceptaDJ) return showToast('error', 'Debes aceptar la declaración jurada.');
    setLoading(true);
    try {
      await reservaService.crearReservaEstudiante({
        user_id: userId,
        id_horario: horarioSel.id_horario,
        id_activo: activoSel.id_activo,
        acepto_declaracion_jurada: true,
      });
      showToast('ok', '¡Reserva registrada! Tienes 5 minutos para que se unan 10 alumnos o será cancelada.');
      setVista('mis-reservas');
      setPaso(1);
    } catch (err) {
      showToast('error', err.response?.data?.error || 'Error al reservar.');
    } finally {
      setLoading(false);
    }
  };

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

  const handleLogout = async () => {
    // C-2: invalidar sesión en BD y expirar la cookie httpOnly desde el servidor
    await logoutUser();
    localStorage.clear();
    navigate("/");
  };

  const horariosByDate = horarios.reduce((acc, h) => {
    if (!acc[h.fecha]) acc[h.fecha] = [];
    acc[h.fecha].push(h);
    return acc;
  }, {});

  return (
    <div className="est-layout">
      {toast && <div className={`est-toast est-toast--${toast.tipo}`}>{toast.texto}</div>}

      {/* MODAL DETALLE RESERVA */}
      {reservaDetalle && (
        <div className="modal-overlay" onClick={() => setReservaDetalle(null)} style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center', overflowY: 'auto', padding: '40px 20px', zIndex: 9000 }}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 600, width: '90%', borderRadius: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, borderBottom: '1px solid var(--border-color)', paddingBottom: 12 }}>
              <h2 style={{ margin: 0, fontSize: 18 }}>Detalle de Reserva #{reservaDetalle.id_reserva}</h2>
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
                  {label === 'Estado'
                    ? <StatusBadge estado={reservaDetalle.estado} />
                    : <strong>{val}</strong>
                  }
                </div>
              ))}
              {reservaDetalle.activos && reservaDetalle.activos.length > 0 && (
                <div>
                  <div style={{ opacity: 0.6, marginBottom: 8 }}>Equipo(s) reservado(s):</div>
                  {reservaDetalle.activos.map(a => (
                    <div key={a.id_activo} style={{ background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: 8, padding: '8px 12px', marginBottom: 6, fontSize: 13 }}>
                      <strong>{a.tipo_activo_nombre}</strong> · {a.codigo_patrimonio || a.num_serie}
                    </div>
                  ))}
                </div>
              )}
              {reservaDetalle.historial_cambios && reservaDetalle.historial_cambios.length > 0 && (
                <div>
                  <div style={{ opacity: 0.6, marginBottom: 8 }}>Historial de estados:</div>
                  {reservaDetalle.historial_cambios.map((log, i) => (
                    <div key={i} style={{ fontSize: 12, background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: 8, padding: '6px 12px', marginBottom: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>{log.estado_anterior} ➔ <strong>{log.estado_nuevo}</strong></span>
                      <span style={{ opacity: 0.5 }}>{log.fecha_cambio}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end' }}>
              <button className="cancel-btn" onClick={() => setReservaDetalle(null)} style={{ padding: '8px 20px', borderRadius: 8, cursor: 'pointer' }}>Cerrar</button>
            </div>
          </div>
        </div>
      )}

      <aside className="est-sidebar">
        <div className="est-brand"><div className="est-brand-logo">LS</div><div><div className="est-brand-name">LabSync</div><div className="est-brand-role">Estudiante</div></div></div>
        <div className="est-user-card">
          <div className="est-avatar">{nombre[0]}</div>
          <div><div className="est-user-name">{nombre}</div><div className="est-user-meta">{carrera} · {ciclo}° Ciclo</div></div>
        </div>
        <nav className="est-nav">
          <button className={`est-nav-btn ${vista==='inicio'?'active':''}`} onClick={()=>{setVista('inicio'); setPaso(1);}}><Icon.Home /><span>Inicio</span></button>
          <button className={`est-nav-btn ${vista==='nueva-reserva'?'active':''}`} onClick={()=>{setVista('nueva-reserva'); setPaso(1);}}><Icon.Book /><span>Reservar</span></button>
          <button className={`est-nav-btn ${vista==='mis-reservas'?'active':''}`} onClick={()=>{setVista('mis-reservas'); setPaso(1);}}><Icon.List /><span>Mis Reservas</span></button>
          <div style={{ flex: 1 }}></div>
          <div className="est-theme-container" style={{ padding: '10px 20px' }}>
            <span style={{ fontSize: 12, opacity: 0.6, display: 'block', marginBottom: 8 }}>Apariencia</span>
            <ThemeToggle fixed={false} />
          </div>
        </nav>
        <button className="est-logout" onClick={handleLogout}><Icon.Logout /><span>Cerrar Sesión</span></button>
      </aside>

      <main className="est-main">
        {vista === 'inicio' && (
          <div className="est-welcome">
            <h1>¡Hola, {nombre}! 👋</h1>
            <p>Bienvenido al sistema de reserva de laboratorios.</p>
          </div>
        )}

        {vista === 'nueva-reserva' && (
          <div className="est-wizard">
            {paso === 1 && (
              <div className="est-section">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                  <h2>Selecciona un Laboratorio</h2>
                  <div className="doc-search-box">
                    <Icon.Search />
                    <input 
                      type="text" 
                      placeholder="Buscar por código o nombre..." 
                      value={labSearchTerm}
                      onChange={(e) => setLabSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                {loading ? <div className="est-loading">Cargando laboratorios...</div> : (
                  <div className="est-lab-grid">
                    {laboratorios.filter(lab => {
                      const term = labSearchTerm.toLowerCase();
                      const nombre = (lab.nombre || '').toLowerCase();
                      const codigo = (lab.codigo_patrimonio || '').toLowerCase();
                      return nombre.includes(term) || codigo.includes(term);
                    }).map(lab => (
                      <button key={lab.id_laboratorio} className="est-lab-card" onClick={()=>{
                        setLabSel(lab); 
                        setHorarioSel(null);
                        setActivoSel(null);
                        setPaso(2);
                      }}>
                        <div className="est-lab-name">{lab.nombre}</div>
                        <div className="est-lab-foot">🖥 {lab.equipos_operativos}/{lab.aforo_maximo} operativos</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            {paso === 2 && (
              <div className="est-section">
                <button className="est-back" onClick={() => setPaso(1)} style={{ marginBottom: 16 }}>
                  <Icon.ChevronLeft /> Volver
                </button>
                <h2>Horarios Disponibles</h2>
                <div className="est-calendar">
                  {Object.entries(horariosByDate).map(([fecha, slots]) => (
                    <div key={fecha} className="est-cal-day">
                      <div className="est-cal-date">{fecha}</div>
                      {slots.map(h => (
                        <button 
                          key={h.id_horario} 
                          className={`est-cal-slot ${!h.es_reservable ? 'blocked' : ''}`} 
                          onClick={()=>{
                            if(!h.es_reservable) return;
                            setHorarioSel(h); 
                            setActivoSel(null);
                            setPaso(3);
                          }}
                          disabled={!h.es_reservable}
                          title={!h.es_reservable ? "Este horario está bloqueado por el límite de 24h de anticipación." : ""}
                        >
                          {h.hora_inicio.slice(0,5)} - {h.hora_fin.slice(0,5)}
                          {!h.es_reservable && <span style={{display:'block', fontSize: 10, opacity: 0.6}}>Bloqueado</span>}
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {paso === 3 && (
              <div className="est-section">
                <button className="est-back" onClick={() => setPaso(2)} style={{ marginBottom: 16 }}>
                  <Icon.ChevronLeft /> Volver
                </button>
                <h2>Mapa de Equipos</h2>
                <LabMap activos={activos} activoSel={activoSel} onSelect={setActivoSel} columnas={labSel?.codigo_patrimonio === 'A1-1' ? 6 : 6} />
                
                {/* PANEL INFO DEL ACTIVO SELECCIONADO */}
                {activoSel && (
                  <div className="est-activo-panel">
                    <div className="est-activo-panel-header">
                      <div className="est-activo-panel-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{width:20,height:20}}><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="8" y="8" width="8" height="8"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="12" y1="1" x2="12" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="12" y1="20" x2="12" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/><line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="12" x2="4" y2="12"/><line x1="1" y1="15" x2="4" y2="15"/><line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="12" x2="23" y2="12"/><line x1="20" y1="15" x2="23" y2="15"/></svg>
                      </div>
                      <div className="est-activo-panel-title">
                        <strong>{activoSel.tipo_activo_nombre || 'Equipo'}</strong>
                        <span className="est-activo-badge">
                          <span style={{width:7,height:7,borderRadius:'50%',background:'#10b981',display:'inline-block',marginRight:4}}/>
                          Operativo
                        </span>
                      </div>
                      <button className="est-activo-panel-close" onClick={() => setActivoSel(null)} title="Deseleccionar">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                      </button>
                    </div>
                    <div className="est-activo-panel-body">
                      <div className="est-activo-chips">
                        <div className="est-activo-chip">
                          <span className="est-activo-chip-label">Código</span>
                          <strong>{activoSel.codigo_patrimonio || '—'}</strong>
                        </div>
                        <div className="est-activo-chip">
                          <span className="est-activo-chip-label">N° Serie</span>
                          <strong>{activoSel.num_serie || '—'}</strong>
                        </div>
                      </div>
                      {/* Periféricos del mismo puesto */}
                      {(() => {
                        const puestoNum = activoSel.num_serie?.split('-').slice(-1)[0];
                        if (!puestoNum) return null;
                        const perifericos = activos.filter(a =>
                          a.id_activo !== activoSel.id_activo &&
                          a.num_serie?.endsWith(`-${puestoNum}`)
                        );
                        if (perifericos.length === 0) return null;
                        return (
                          <div className="est-perifericos">
                            <div className="est-perifericos-title">Periféricos incluidos en el puesto:</div>
                            {perifericos.map(p => (
                              <div key={p.id_activo} className="est-periferico-row">
                                <span className="est-periferico-tipo">{p.tipo_activo_nombre}</span>
                                <span className="est-periferico-serie">{p.num_serie}</span>
                                <span className={`est-periferico-dot ${p.estado === 'Operativo' ? 'ok' : 'bad'}`} />
                              </div>
                            ))}
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                )}
                <button className="est-btn-primary" onClick={()=>setPaso(4)} disabled={!activoSel}>Continuar</button>
              </div>
            )}
            {paso === 4 && (
              <div className="est-section est-confirm">
                <button className="est-back" onClick={() => setPaso(3)} style={{ marginBottom: 16 }}>
                  <Icon.ChevronLeft /> Volver
                </button>
                <h2>Confirmar Reserva</h2>

                <div className="est-confirm-card">
                  <div className="est-confirm-row"><span>Laboratorio</span><strong>{labSel?.nombre}</strong></div>
                  <div className="est-confirm-row"><span>Código</span><strong>{labSel?.codigo_patrimonio}</strong></div>
                  <div className="est-confirm-row"><span>Fecha</span><strong>{horarioSel?.fecha}</strong></div>
                  <div className="est-confirm-row"><span>Horario</span><strong>{horarioSel?.hora_inicio?.slice(0,5)} – {horarioSel?.hora_fin?.slice(0,5)}</strong></div>
                  <div className="est-confirm-row"><span>Equipo</span><strong>{activoSel?.codigo_patrimonio || activoSel?.num_serie || '1 equipo'}</strong></div>
                </div>

                {/* Declaración Jurada */}
                <div className="est-dj-box">
                  <div className="est-dj-header" onClick={() => setShowDJ(!showDJ)} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Icon.Shield />
                    <span>Declaración Jurada Digital</span>
                    <span style={{ marginLeft: 'auto', fontSize: 12, opacity: 0.6 }}>{showDJ ? '▲ Ocultar' : '▼ Leer'}</span>
                  </div>
                  {showDJ && (
                    <div className="est-dj-text" style={{ marginTop: 12 }}>
                      <p>Yo, <strong>{nombre}</strong>, declaro bajo juramento que:</p>
                      <ol style={{ paddingLeft: 20, marginTop: 8 }}>
                        <li style={{ marginBottom: 6 }}>Asumo plena responsabilidad sobre el equipo <strong>{activoSel?.codigo_patrimonio || 'asignado'}</strong> del laboratorio <strong>{labSel?.nombre}</strong> durante el horario reservado.</li>
                        <li style={{ marginBottom: 6 }}>Me comprometo a reportar cualquier daño, rayadura o anomalía física al asistente de laboratorio de forma inmediata.</li>
                        <li style={{ marginBottom: 6 }}>El equipo informático será utilizado exclusivamente para fines académicos y de investigación.</li>
                        <li style={{ marginBottom: 6 }}>Entiendo que el mal uso, retiro de periféricos o daños intencionales generará la cancelación de mi acceso y las penalizaciones académicas correspondientes.</li>
                      </ol>
                    </div>
                  )}
                  <label className="est-dj-check" style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 12, cursor: 'pointer' }}>
                    <input type="checkbox" checked={aceptaDJ} onChange={e => setAceptaDJ(e.target.checked)} style={{ cursor: 'pointer' }} />
                    <span>He leído y acepto la Declaración Jurada de Responsabilidad Estudiantil</span>
                  </label>
                </div>

                <button 
                  className="est-btn-primary" 
                  onClick={handleSubmitReserva} 
                  disabled={loading || !aceptaDJ}
                >
                  {loading ? 'Procesando...' : 'Confirmar y Finalizar Reserva'}
                </button>
              </div>
            )}
          </div>
        )}

        {vista === 'mis-reservas' && (
          <div className="est-section">
            <h2>Mis Reservas</h2>
            <div className="est-reservas-list">
              {misReservas.length === 0 && <p className="est-empty">No tienes reservas aún.</p>}
              {misReservas.map(r => (
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
                    {(r.estado === 'Programada' || r.estado === 'Pendiente') && (
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
          </div>
        )}
      </main>
    </div>
  );
}

export default Estudiante;