import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import laboratorioService from "../../services/laboratorioService";
import reservaService from "../../services/reservaService";
import { logoutUser } from "../../services/auth";
import LabMap from "../../components/LabMap";
import ThemeToggle from "../../components/ThemeToggle";
import "./Docente.css";

/* ─── SVG Icons ─── */
const Icon = {
  Home: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  Plus: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>,
  List: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>,
  Logout: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  Monitor: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>,
  Bolt:    () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>,
  Leaf:    () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 3.5 1 8.5C18 13 13.5 14 11 20z"/></svg>,
  Atom:    () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M12 21c-4.97 0-9-4.03-9-9s4.03-9 9-9 9 4.03 9 9-4.03 9-9 9z"/><path d="M2.5 12h19"/><path d="M12 2.5v19"/></svg>,
  Check:   () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>,
  Clock:   () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  Shield:  () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  ChevronLeft: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>,
  Search: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
};

const CATEGORIAS = [
  { nombre: 'Cómputo',    icono: Icon.Monitor, color: '#3b82f6', bg: '#eff6ff' },
  { nombre: 'Electrónica',icono: Icon.Bolt,    color: '#f59e0b', bg: '#fffbeb' },
  { nombre: 'Ambiental',  icono: Icon.Leaf,    color: '#10b981', bg: '#f0fdf4' },
  { nombre: 'Física',     icono: Icon.Atom,    color: '#8b5cf6', bg: '#f5f3ff' },
];

const DEPTO_MAP = {
  'Ingeniería de Sistemas':  ['Cómputo', 'Física'],
  'Ingeniería Ambiental':    ['Ambiental', 'Física'],
  'Ingeniería Electrónica':  ['Electrónica', 'Física'],
};

function StatusBadge({ estado }) {
  const cfg = {
    Programada:  { bg: '#dbeafe', color: '#1d4ed8', dot: '#3b82f6' },
    Completada:  { bg: '#d1fae5', color: '#065f46', dot: '#10b981' },
    Cancelada:   { bg: '#fee2e2', color: '#991b1b', dot: '#ef4444' },
    'No-show':   { bg: '#fef3c7', color: '#92400e', dot: '#f59e0b' },
  }[estado] || { bg: '#f3f4f6', color: '#374151', dot: '#9ca3af' };
  return (
    <span style={{ background: cfg.bg, color: cfg.color, padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
      <span style={{ width: 7, height: 7, borderRadius: '50%', background: cfg.dot }} />
      {estado}
    </span>
  );
}

function Docente() {
  const navigate = useNavigate();
  const [vista, setVista] = useState("inicio");
  const [paso, setPaso] = useState(1);
  const [toast, setToast] = useState(null);

  // Step state
  const [categoriaSel, setCategoriaSel] = useState(null);
  const [labSel, setLabSel]             = useState(null);
  const [horarioSel, setHorarioSel]     = useState(null);
  const [activosSel, setActivosSel]     = useState([]);
  const [labSearchTerm, setLabSearchTerm] = useState("");

  const activosSelRef = useRef(activosSel);
  useEffect(() => {
    activosSelRef.current = activosSel;
  }, [activosSel]);

  // Data
  const [laboratorios, setLaboratorios] = useState([]);
  const [horarios, setHorarios]         = useState([]);
  const [activos, setActivos]           = useState([]);
  const [misReservas, setMisReservas]   = useState([]);
  const [loading, setLoading]           = useState(false);

  // Form

  const [aceptaDJ, setAceptaDJ]         = useState(false);
  const [showDJ, setShowDJ]             = useState(false);

  // Detalle de reserva modal
  const [reservaDetalle, setReservaDetalle] = useState(null);

  const userId   = localStorage.getItem("id_usuario") || "";
  const depto    = localStorage.getItem("departamento") || "";
  const nombre   = localStorage.getItem("nombre") || "Docente";
  const catPerm  = CATEGORIAS.filter(c => {
    const arr = DEPTO_MAP[depto];
    return !arr || arr.includes(c.nombre);
  });

  const showToast = (tipo, texto, dur = 4000) => {
    setToast({ tipo, texto });
    setTimeout(() => setToast(null), dur);
  };

  // Fetch labs by category
  useEffect(() => {
    if (paso === 2 && categoriaSel) {
      setLoading(true);
      laboratorioService.getLaboratorios()
        .then(data => setLaboratorios(data.filter(l => l.tipo_nombre === categoriaSel)))
        .catch(() => showToast('error', 'Error al cargar laboratorios'))
        .finally(() => setLoading(false));
    }
  }, [paso, categoriaSel]);

  // Fetch schedules when lab selected
  useEffect(() => {
    if (paso === 3 && labSel) {
      setLoading(true);
      reservaService.getHorariosPorLab(labSel.id_laboratorio)
        .then(setHorarios)
        .catch(() => showToast('error', 'Error al cargar horarios'))
        .finally(() => setLoading(false));
    }
  }, [paso, labSel]);

  // Fetch activos e implementar Polling reactivo en tiempo real para Docente
  useEffect(() => {
    let intervalId = null;

    if (paso === 4 && labSel && horarioSel) {
      const cargarEquipos = async (showLoading = false) => {
        if (showLoading) setLoading(true);
        try {
          const data = await laboratorioService.getActivosPorLab(labSel.id_laboratorio, horarioSel.id_horario);
          // Filtrar por CPU o Mesa
          const CPUoMesa = data.filter(a => a.tipo_activo_nombre === 'CPU' || a.tipo_activo_nombre === 'Mesa');
          setActivos(CPUoMesa);

          // Si el docente ya seleccionó equipos, verificar si alguno fue reservado en paralelo por alumnos
          if (activosSelRef.current.length > 0) {
            const disponibles = CPUoMesa.filter(a => 
              a.estado === 'Operativo' && 
              !a.reservado && 
              a.estado_reserva !== 'Pendiente'
            ).map(a => a.id_activo);

            const nuevosSeleccionados = activosSelRef.current.filter(id => disponibles.includes(id));
            if (nuevosSeleccionados.length !== activosSelRef.current.length) {
              setActivosSel(nuevosSeleccionados);
              showToast('error', 'Algunos de los equipos que seleccionaste acaban de ser ocupados o inhabilitados.');
            }
          }
        } catch (err) {
          console.error("Error al actualizar equipos en docente:", err);
        } finally {
          if (showLoading) setLoading(false);
        }
      };

      // Carga inicial
      cargarEquipos(true);

      // Polling reactivo cada 3 segundos
      intervalId = setInterval(() => {
        cargarEquipos(false);
      }, 3000);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [paso, labSel, horarioSel]);

  // Fetch my reservations
  const fetchMisReservas = useCallback(async () => {
    if (!userId) return;
    try {
      const data = await reservaService.getMisReservas(userId);
      setMisReservas(data);
    } catch { showToast('error', 'Error al cargar tus reservas'); }
  }, [userId]);

  useEffect(() => {
    let intervalId = null;
    if (vista === "mis-reservas") {
      fetchMisReservas();
      intervalId = setInterval(fetchMisReservas, 10000);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [vista, fetchMisReservas]);

  const toggleActivo = (id) => {
    setActivosSel(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const selectAllAvailable = () => {
    const ids = activos
      .filter(a => a.estado === 'Operativo' && !a.reservado && a.estado_reserva !== 'Pendiente')
      .map(a => a.id_activo);
    setActivosSel(ids);
  };

  const deselectAll = () => {
    setActivosSel([]);
  };



  const resetFlujo = () => {
    setPaso(1); setCategoriaSel(null); setLabSel(null);
    setHorarioSel(null); setActivosSel([]); setAceptaDJ(false);
  };

  const handleSubmitReserva = async () => {
    if (activosSel.length === 0) {
      return showToast('error', 'Debes seleccionar al menos un equipo en el mapa para tu clase.');
    }
    if (!aceptaDJ) {
      return showToast('error', 'Debes aceptar la Declaración Jurada para continuar.');
    }
    setLoading(true);
    try {
      await reservaService.crearReserva({
        user_id: userId,
        id_horario: horarioSel.id_horario,
        cantidad_alumnos: activosSel.length, // Automatizado según selección de mapa
        acepto_declaracion_jurada: true,
        activos_ids: activosSel,
      });
      showToast('ok', '¡Reserva creada exitosamente!');
      resetFlujo();
      setVista('mis-reservas');
    } catch (err) {
      showToast('error', err.response?.data?.error || 'Error al crear la reserva.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelar = async (id) => {
    if (!window.confirm('¿Cancelar esta reserva?')) return;
    try {
      await reservaService.cancelarReserva(id, userId);
      showToast('ok', 'Reserva cancelada.');
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

  // Sidebar nav items
  const navItems = [
    { id: 'inicio',         label: 'Inicio',        icon: Icon.Home  },
    { id: 'nueva-reserva',  label: 'Nueva Reserva', icon: Icon.Plus  },
    { id: 'mis-reservas',   label: 'Mis Reservas',  icon: Icon.List  },
  ];

  return (
    <div className="doc-layout">

      {/* ── TOAST ── */}
      {toast && (
        <div className={`doc-toast doc-toast--${toast.tipo}`}>
          {toast.tipo === 'ok' ? <Icon.Check /> : '⚠'}
          <span>{toast.texto}</span>
        </div>
      )}

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
                ['Alumnos', reservaDetalle.cantidad_alumnos],
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

      {/* ── SIDEBAR ── */}
      <aside className="doc-sidebar">
        <div className="doc-brand">
          <div className="doc-brand-logo">LS</div>
          <div>
            <div className="doc-brand-name">LabSync</div>
            <div className="doc-brand-role">Panel Docente</div>
          </div>
        </div>

        <div className="doc-user-card">
          <div className="doc-avatar">{nombre.charAt(0).toUpperCase()}</div>
          <div>
            <div className="doc-user-name">{nombre}</div>
            <div className="doc-user-dept">{depto || 'Docente'}</div>
          </div>
        </div>

        <nav className="doc-nav">
          {navItems.map(item => (
            <button
              key={item.id}
              className={`doc-nav-btn ${vista === item.id ? 'active' : ''}`}
              onClick={() => { setVista(item.id); resetFlujo(); }}
            >
              <item.icon />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="doc-theme-section" style={{ padding: '0 20px', marginBottom: '20px' }}>
          <span style={{ fontSize: 11, opacity: 0.5, textTransform: 'uppercase', letterSpacing: '1px', display: 'block', marginBottom: '10px' }}>Apariencia</span>
          <ThemeToggle fixed={false} />
        </div>

        <button className="doc-logout" onClick={handleLogout}>
          <Icon.Logout />
          <span>Cerrar Sesión</span>
        </button>
      </aside>

      {/* ── MAIN ── */}
      <main className="doc-main">

        {/* ══ INICIO ══ */}
        {vista === 'inicio' && (
          <div className="doc-welcome">
            <div className="doc-welcome-text">
              <h1>Bienvenido, {nombre.split(' ')[0]} 👋</h1>
              <p>Gestiona tus reservas de laboratorio desde este panel.</p>
            </div>
            <div className="doc-stat-cards">
              {[
                { label: 'Reservas Activas',   val: misReservas.filter(r => r.estado === 'Programada').length,  color: '#3b82f6' },
                { label: 'Completadas',         val: misReservas.filter(r => r.estado === 'Completada').length,  color: '#10b981' },
                { label: 'Canceladas',          val: misReservas.filter(r => r.estado === 'Cancelada').length,   color: '#ef4444' },
              ].map(c => (
                <div key={c.label} className="doc-stat-card">
                  <span className="doc-stat-val" style={{ color: c.color }}>{c.val}</span>
                  <span className="doc-stat-lbl">{c.label}</span>
                </div>
              ))}
            </div>
            <button className="doc-cta" onClick={() => setVista('nueva-reserva')}>
              <Icon.Plus /> Crear Nueva Reserva
            </button>
          </div>
        )}

        {/* ══ NUEVA RESERVA — STEPPER ══ */}
        {vista === 'nueva-reserva' && (
          <div className="doc-flow">
            {/* Progress */}
            <div className="doc-stepper">
              {['Categoría', 'Laboratorio', 'Horario', 'Equipos', 'Confirmar'].map((s, i) => (
                <div key={s} className={`doc-step ${paso > i + 1 ? 'done' : ''} ${paso === i + 1 ? 'active' : ''}`}>
                  <div className="doc-step-circle">{paso > i + 1 ? <Icon.Check /> : i + 1}</div>
                  <span>{s}</span>
                </div>
              ))}
            </div>

            {/* Back button */}
            {paso > 1 && (
              <button className="doc-back" onClick={() => setPaso(p => p - 1)}>
                <Icon.ChevronLeft /> Volver
              </button>
            )}

            {/* ─ PASO 1: Categoría ─ */}
            {paso === 1 && (
              <div className="doc-section">
                <h2>¿Qué tipo de laboratorio necesitas?</h2>
                <div className="doc-cat-grid">
                  {catPerm.map(cat => (
                    <button
                      key={cat.nombre}
                      className="doc-cat-card"
                      style={{ '--cat-color': cat.color, '--cat-bg': cat.bg }}
                      onClick={() => { setCategoriaSel(cat.nombre); setPaso(2); }}
                    >
                      <div className="doc-cat-icon"><cat.icono /></div>
                      <span>{cat.nombre}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ─ PASO 2: Laboratorio ─ */}
            {paso === 2 && (
              <div className="doc-section">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                  <h2>Laboratorios de {categoriaSel}</h2>
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
                {loading ? <div className="doc-loading">Cargando laboratorios…</div> : (
                  <div className="doc-lab-grid">
                    {laboratorios.filter(lab => {
                      const term = labSearchTerm.toLowerCase();
                      const nombre = (lab.nombre || '').toLowerCase();
                      const codigo = (lab.codigo_patrimonio || '').toLowerCase();
                      return nombre.includes(term) || codigo.includes(term);
                    }).map(lab => (
                      <button
                        key={lab.id_laboratorio}
                        className={`doc-lab-card ${!lab.habilitado ? 'disabled' : ''}`}
                        onClick={() => { 
                          if (!lab.habilitado) return; 
                          setLabSel(lab); 
                          setHorarioSel(null);
                          setActivos([]);
                          setActivosSel([]);
                          setPaso(3); 
                        }}
                        disabled={!lab.habilitado}
                      >
                        <div className="doc-lab-code">{lab.codigo_patrimonio}</div>
                        <div className="doc-lab-name">{lab.nombre}</div>
                        <div className="doc-lab-meta">
                          <span><Icon.Monitor /> {lab.aforo_maximo} puestos</span>
                          <span className={`doc-lab-badge ${lab.habilitado ? 'ok' : 'ko'}`}>
                            {lab.habilitado ? 'Disponible' : 'Inhabilitado'}
                          </span>
                        </div>
                      </button>
                    ))}
                    {laboratorios.length === 0 && <p className="doc-empty">No hay laboratorios de esta categoría disponibles.</p>}
                  </div>
                )}
              </div>
            )}

            {/* ─ PASO 3: Horario ─ */}
            {paso === 3 && (
              <div className="doc-section">
                <h2>Selecciona un horario — <span className="doc-sub">{labSel?.nombre}</span></h2>
                <p className="doc-hint"><Icon.Clock /> Selecciona un horario disponible para realizar tu reserva.</p>
                {loading ? <div className="doc-loading">Cargando horarios…</div> : (
                  <div className="doc-slots-grid">
                    {horarios.map(h => (
                      <button
                        key={h.id_horario}
                        className={`doc-slot ${horarioSel?.id_horario === h.id_horario ? 'selected' : ''}`}
                        onClick={() => { 
                          setHorarioSel(h); 
                          setActivosSel([]); 
                          setPaso(4); 
                        }}
                      >
                        <div className="doc-slot-date">{new Date(h.fecha + 'T00:00:00').toLocaleDateString('es-PE', { weekday: 'short', day: 'numeric', month: 'short' })}</div>
                        <div className="doc-slot-time">{h.hora_inicio.slice(0,5)} – {h.hora_fin.slice(0,5)}</div>
                      </button>
                    ))}
                    {horarios.length === 0 && <p className="doc-empty">No hay horarios disponibles. Prueba otra semana.</p>}
                  </div>
                )}
              </div>
            )}

            {/* ─ PASO 4: Equipos ─ */}
            {paso === 4 && (
              <div className="doc-section">
                <h2>Selecciona los equipos a utilizar</h2>
                <p className="doc-hint">Haz clic en cada equipo que usarás. Los <strong>azules</strong> son los seleccionados.</p>
                
                <LabMap 
                  activos={activos} 
                  activoSel={activosSel} 
                  onSelect={(a) => toggleActivo(a.id_activo)} 
                  columnas={labSel?.codigo_patrimonio === 'A1-1' ? 5 : 6} 
                />

                <div className="doc-bulk-actions" style={{ display: 'flex', gap: 12, marginTop: 16 }}>
                  <button className="doc-btn-secondary" onClick={selectAllAvailable}>
                    Seleccionar todo el aula
                  </button>
                  <button className="doc-btn-outline" onClick={deselectAll}>
                    Limpiar selección
                  </button>
                </div>

                <div className="doc-equip-summary" style={{ marginTop: 24, padding: 12, background: 'rgba(255,255,255,0.05)', borderRadius: 8 }}>
                  <strong>{activosSel.length}</strong> equipo(s) seleccionados para tu clase.
                </div>
                <button className="doc-btn-primary" onClick={() => setPaso(5)}>
                  Continuar
                </button>
              </div>
            )}

            {/* ─ PASO 5: Confirmar ─ */}
            {paso === 5 && (
              <div className="doc-section doc-confirm">
                <h2>Confirmar Reserva</h2>

                <div className="doc-confirm-card">
                  <div className="doc-confirm-row"><span>Laboratorio</span><strong>{labSel?.nombre}</strong></div>
                  <div className="doc-confirm-row"><span>Código</span><strong>{labSel?.codigo_patrimonio}</strong></div>
                  <div className="doc-confirm-row"><span>Fecha</span><strong>{horarioSel?.fecha}</strong></div>
                  <div className="doc-confirm-row"><span>Horario</span><strong>{horarioSel?.hora_inicio?.slice(0,5)} – {horarioSel?.hora_fin?.slice(0,5)}</strong></div>
                  <div className="doc-confirm-row"><span>Equipos</span><strong>{activosSel.length} seleccionados</strong></div>
                </div>

                <div className="doc-confirm-info" style={{ marginBottom: 20, fontSize: 13, opacity: 0.7, fontStyle: 'italic' }}>
                  * La cantidad de alumnos se registra automáticamente según los equipos seleccionados ({activosSel.length}).
                </div>

                {/* Declaración Jurada */}
                <div className="doc-dj-box">
                  <div className="doc-dj-header" onClick={() => setShowDJ(!showDJ)}>
                    <Icon.Shield />
                    <span>Declaración Jurada Digital</span>
                    <span style={{ marginLeft: 'auto', fontSize: 12, opacity: 0.6 }}>{showDJ ? '▲ Ocultar' : '▼ Leer'}</span>
                  </div>
                  {showDJ && (
                    <div className="doc-dj-text">
                      <p>Yo, <strong>{nombre}</strong>, declaro bajo juramento que:</p>
                      <ol>
                        <li>Asumo plena responsabilidad sobre los equipos del laboratorio <strong>{labSel?.nombre}</strong> durante el horario reservado.</li>
                        <li>Me comprometo a reportar cualquier daño o anomalía al asistente de laboratorio inmediatamente.</li>
                        <li>Los equipos serán utilizados exclusivamente para fines académicos.</li>
                        <li>Entiendo que el incumplimiento puede generar penalizaciones y restricciones de acceso al sistema.</li>
                      </ol>
                    </div>
                  )}
                  <label className="doc-dj-check">
                    <input type="checkbox" checked={aceptaDJ} onChange={e => setAceptaDJ(e.target.checked)} />
                    <span>He leído y acepto la Declaración Jurada de Responsabilidad</span>
                  </label>
                </div>

                <button
                  className="doc-btn-primary"
                  onClick={handleSubmitReserva}
                  disabled={loading || !aceptaDJ}
                >
                  {loading ? 'Creando…' : 'Confirmar Reserva'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* ══ MIS RESERVAS ══ */}
        {vista === 'mis-reservas' && (
          <div className="doc-section">
            <div className="doc-section-header">
              <h2>Mis Reservas</h2>
            </div>
            {misReservas.length === 0 ? (
              <div className="doc-empty-state">
                <div style={{ fontSize: 48, marginBottom: 12 }}>📋</div>
                <p>Aún no tienes reservas registradas.</p>
                <button className="doc-btn-primary" onClick={() => setVista('nueva-reserva')}>Crear mi primera reserva</button>
              </div>
            ) : (
              <div className="doc-reservas-list">
                {misReservas.map(r => (
                  <div key={r.id_reserva} className="doc-reserva-card">
                    <div className="doc-reserva-left">
                      <div className="doc-reserva-lab">{r.laboratorio_nombre}</div>
                      <div className="doc-reserva-meta">
                        <span><Icon.Clock /> {r.fecha_reserva} · {String(r.hora_inicio).slice(0,5)} – {String(r.hora_fin).slice(0,5)}</span>
                        <span>👥 {r.cantidad_alumnos} alumnos</span>
                      </div>
                    </div>
                    <div className="doc-reserva-right">
                      <StatusBadge estado={r.estado} />
                      <button
                        onClick={() => setReservaDetalle(r)}
                        style={{ padding: '4px 12px', fontSize: 12, background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: 4, cursor: 'pointer', color: 'var(--text-main)' }}
                      >
                        Ver detalle
                      </button>
                      {r.estado === 'Programada' && (
                        <button className="doc-btn-cancel" onClick={() => handleCancelar(r.id_reserva)}>Cancelar</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </main>
    </div>
  );
}

export default Docente;