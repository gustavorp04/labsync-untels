import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import laboratorioService from "../../services/laboratorioService";
import reservaService from "../../services/reservaService";
import LabMap from "../../components/LabMap";
import { getLabLayout } from "../../components/labLayoutConfig";

const Icon = {
  Monitor:     () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>,
  Bolt:        () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>,
  Leaf:        () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 3.5 1 8.5C18 13 13.5 14 11 20z"/></svg>,
  Atom:        () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M12 21c-4.97 0-9-4.03-9-9s4.03-9 9-9 9 4.03 9 9-4.03 9-9 9z"/><path d="M2.5 12h19"/><path d="M12 2.5v19"/></svg>,
  Check:       () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>,
  Clock:       () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  Shield:      () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  ChevronLeft: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>,
  Search:      () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
};

const CATEGORIAS = [
  { nombre: 'Cómputo',     icono: Icon.Monitor, color: '#3b82f6', bg: '#eff6ff' },
  { nombre: 'Electrónica', icono: Icon.Bolt,    color: '#f59e0b', bg: '#fffbeb' },
  { nombre: 'Ambiental',   icono: Icon.Leaf,    color: '#10b981', bg: '#f0fdf4' },
  { nombre: 'Física',      icono: Icon.Atom,    color: '#8b5cf6', bg: '#f5f3ff' },
];

const DEPTO_MAP = {
  'Ingeniería de Sistemas':  ['Cómputo', 'Física'],
  'Ingeniería Ambiental':    ['Ambiental', 'Física'],
  'Ingeniería Electrónica':  ['Electrónica', 'Física'],
};

function DocenteReservar() {
  const navigate = useNavigate();
  const { showToast } = useOutletContext();

  const userId = localStorage.getItem("id_usuario") || "";
  const nombre = localStorage.getItem("nombre") || "Docente";
  const depto  = localStorage.getItem("departamento") || "";

  const normalize = useCallback((str) => (str || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""), []);

  const tiposPermitidos = useMemo(() => {
    const arr = DEPTO_MAP[depto];
    if (!arr) return CATEGORIAS.map(c => normalize(c.nombre));
    return arr.map(c => normalize(c));
  }, [depto, normalize]);

  const catPerm = CATEGORIAS.filter(c => {
    const arr = DEPTO_MAP[depto];
    return !arr || arr.includes(c.nombre);
  });

  const [paso, setPaso]               = useState(1);
  const [categoriaSel, setCategoriaSel] = useState(null);
  const [labSel, setLabSel]           = useState(null);
  const [horarioSel, setHorarioSel]   = useState(null);
  const [activosSel, setActivosSel]   = useState([]);
  const [labSearchTerm, setLabSearchTerm] = useState("");

  const [laboratorios, setLaboratorios] = useState([]);
  const [horarios, setHorarios]         = useState([]);
  const [activos, setActivos]           = useState([]);
  const [loading, setLoading]           = useState(false);

  const [aceptaDJ, setAceptaDJ] = useState(false);
  const [showDJ, setShowDJ]     = useState(false);

  const activosSelRef = useRef(activosSel);
  useEffect(() => { activosSelRef.current = activosSel; }, [activosSel]);

  const resetFlujo = () => {
    setPaso(1); setCategoriaSel(null); setLabSel(null);
    setHorarioSel(null); setActivosSel([]); setAceptaDJ(false);
  };

  // Fetch labs on step 2
  useEffect(() => {
    const abortCtrl = new AbortController();
    if (paso === 2 && categoriaSel) {
      setLoading(true);
      const reqCat = normalize(categoriaSel);
      if (!tiposPermitidos.includes(reqCat)) {
        showToast('error', 'No tienes permiso para ver esta categoría.');
        setLoading(false);
        return;
      }
      laboratorioService.getLaboratorios([reqCat], { signal: abortCtrl.signal })
        .then(data => setLaboratorios(data))
        .catch(err => { if (err.name !== 'CanceledError' && err.code !== 'ERR_CANCELED') showToast('error', 'Error al cargar laboratorios'); })
        .finally(() => setLoading(false));
    }
    return () => abortCtrl.abort();
  }, [paso, categoriaSel, tiposPermitidos, normalize, showToast]);

  // Fetch schedules on step 3
  useEffect(() => {
    if (paso === 3 && labSel) {
      setHorarios([]);
      setLoading(true);
      reservaService.getHorariosPorLab(labSel.id_laboratorio)
        .then(setHorarios)
        .catch(() => showToast('error', 'Error al cargar horarios'))
        .finally(() => setLoading(false));
    }
  }, [paso, labSel, showToast]);

  // Fetch activos + polling on step 4
  useEffect(() => {
    if (!(paso === 4 && labSel && horarioSel)) return;
    let intervalId = null;
    let isLoading = false;
    const abortCtrl = new AbortController();

    const cargarEquipos = async (showLoading = false) => {
      if (!showLoading && isLoading) return;
      isLoading = true;
      if (showLoading) setLoading(true);
      try {
        const data = await laboratorioService.getActivosPorLab(labSel.id_laboratorio, horarioSel.id_horario, { signal: abortCtrl.signal });
        const CPUoMesa = data.filter(a => a.tipo_activo_nombre === 'CPU' || a.tipo_activo_nombre === 'Mesa');
        setActivos(CPUoMesa);
        if (activosSelRef.current.length > 0) {
          const disponibles = CPUoMesa.filter(a => a.estado === 'Operativo' && !a.reservado && a.estado_reserva !== 'Pendiente').map(a => a.id_activo);
          const nuevos = activosSelRef.current.filter(id => disponibles.includes(id));
          if (nuevos.length !== activosSelRef.current.length) {
            setActivosSel(nuevos);
            showToast('error', 'Algunos equipos seleccionados acaban de ser ocupados o inhabilitados.');
          }
        }
      } catch (err) {
        if (err.name !== 'CanceledError' && err.code !== 'ERR_CANCELED') console.error(err);
      } finally {
        isLoading = false;
        if (showLoading) setLoading(false);
      }
    };

    setActivos([]);
    cargarEquipos(true);
    intervalId = setInterval(() => cargarEquipos(false), 15000);
    return () => { if (intervalId) clearInterval(intervalId); abortCtrl.abort(); };
  }, [paso, labSel, horarioSel, showToast]);

  const toggleActivo = (id) => {
    setActivosSel(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const selectAllAvailable = () => {
    const ids = activos.filter(a => a.estado === 'Operativo' && !a.reservado && a.estado_reserva !== 'Pendiente').map(a => a.id_activo);
    setActivosSel(ids);
  };

  const handleSubmitReserva = async () => {
    if (activosSel.length === 0) return showToast('error', 'Debes seleccionar al menos un equipo en el mapa para tu clase.');
    if (!aceptaDJ) return showToast('error', 'Debes aceptar la Declaración Jurada para continuar.');
    setLoading(true);
    try {
      await reservaService.crearReserva({
        user_id: userId,
        id_horario: horarioSel.id_horario,
        cantidad_alumnos: activosSel.length,
        acepto_declaracion_jurada: true,
        activos_ids: activosSel,
      });
      showToast('ok', '¡Reserva creada exitosamente!');
      resetFlujo();
      navigate('/docente/mis-reservas');
    } catch (err) {
      showToast('error', err.response?.data?.error || 'Error al crear la reserva.');
    } finally {
      setLoading(false);
    }
  };

  const STEP_LABELS = ['Categoría', 'Laboratorio', 'Horario', 'Equipos', 'Confirmar'];

  return (
    <div className="doc-flow">
      <div className="doc-stepper">
        {STEP_LABELS.map((s, i) => (
          <div key={s} className={`doc-step ${paso > i + 1 ? 'done' : ''} ${paso === i + 1 ? 'active' : ''}`}>
            <div className="doc-step-circle">{paso > i + 1 ? <Icon.Check /> : i + 1}</div>
            <span>{s}</span>
          </div>
        ))}
      </div>

      {paso > 1 && (
        <button className="doc-back" onClick={() => setPaso(p => p - 1)}>
          <Icon.ChevronLeft /> Volver
        </button>
      )}

      {/* PASO 1: Categoría */}
      {paso === 1 && (
        <div className="doc-section">
          <h2>¿Qué tipo de laboratorio necesitas?</h2>
          <div className="doc-cat-grid">
            {catPerm.map(cat => (
              <button key={cat.nombre} className="doc-cat-card" style={{ '--cat-color': cat.color, '--cat-bg': cat.bg }}
                onClick={() => { setCategoriaSel(cat.nombre); setPaso(2); }}>
                <div className="doc-cat-icon"><cat.icono /></div>
                <span>{cat.nombre}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* PASO 2: Laboratorio */}
      {paso === 2 && (
        <div className="doc-section">
          <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20 }}>
            <h2>Laboratorios de {categoriaSel}</h2>
            <div className="doc-search-box">
              <Icon.Search />
              <input type="text" placeholder="Buscar por código o nombre..." value={labSearchTerm} onChange={e => setLabSearchTerm(e.target.value)} />
            </div>
          </div>
          {loading ? <div className="doc-loading">Cargando laboratorios…</div> : (
            <div className="doc-lab-grid">
              {laboratorios.filter(lab => {
                const term = labSearchTerm.toLowerCase();
                return (lab.nombre||'').toLowerCase().includes(term) || (lab.codigo_patrimonio||'').toLowerCase().includes(term);
              }).map(lab => (
                <button key={lab.id_laboratorio} className={`doc-lab-card ${!lab.habilitado ? 'disabled' : ''}`}
                  onClick={() => { if (!lab.habilitado) return; setLabSel(lab); setHorarioSel(null); setActivos([]); setActivosSel([]); setPaso(3); }}
                  disabled={!lab.habilitado}>
                  <div className="doc-lab-code">{lab.codigo_patrimonio}</div>
                  <div className="doc-lab-name">{lab.nombre}</div>
                  <div className="doc-lab-meta">
                    <span><Icon.Monitor /> {lab.aforo_maximo} puestos</span>
                    <span className={`doc-lab-badge ${lab.habilitado ? 'ok' : 'ko'}`}>{lab.habilitado ? 'Disponible' : 'Inhabilitado'}</span>
                  </div>
                </button>
              ))}
              {laboratorios.length === 0 && <p className="doc-empty">No hay laboratorios de esta categoría disponibles.</p>}
            </div>
          )}
        </div>
      )}

      {/* PASO 3: Horario */}
      {paso === 3 && (
        <div className="doc-section">
          <h2>Selecciona un horario — <span className="doc-sub">{labSel?.nombre}</span></h2>
          <p className="doc-hint"><Icon.Clock /> Selecciona un horario disponible para realizar tu reserva.</p>
          {loading ? <div className="doc-loading">Cargando horarios…</div> : (
            <div className="doc-slots-grid">
              {horarios.map(h => (
                <button key={h.id_horario} className={`doc-slot ${horarioSel?.id_horario === h.id_horario ? 'selected' : ''}`}
                  onClick={() => { setHorarioSel(h); setActivosSel([]); setPaso(4); }}>
                  <div className="doc-slot-date">{new Date(h.fecha + 'T00:00:00').toLocaleDateString('es-PE', { weekday:'short',day:'numeric',month:'short' })}</div>
                  <div className="doc-slot-time">{h.hora_inicio.slice(0,5)} – {h.hora_fin.slice(0,5)}</div>
                </button>
              ))}
              {horarios.length === 0 && <p className="doc-empty">No hay horarios disponibles. Prueba otra semana.</p>}
            </div>
          )}
        </div>
      )}

      {/* PASO 4: Equipos */}
      {paso === 4 && (
        <div className="doc-section">
          <h2>Selecciona los equipos a utilizar</h2>
          <p className="doc-hint">Haz clic en cada equipo que usarás. Los <strong>azules</strong> son los seleccionados.</p>
          <LabMap activos={activos} activoSel={activosSel} onSelect={(a) => toggleActivo(a.id_activo)} {...getLabLayout(labSel?.codigo_patrimonio)} />
          <div className="doc-bulk-actions" style={{ display:'flex',gap:12,marginTop:16 }}>
            <button className="doc-btn-secondary" onClick={selectAllAvailable}>Seleccionar todo el aula</button>
            <button className="doc-btn-outline" onClick={() => setActivosSel([])}>Limpiar selección</button>
          </div>
          <div className="doc-equip-summary" style={{ marginTop:24,padding:12,background:'rgba(255,255,255,0.05)',borderRadius:8 }}>
            <strong>{activosSel.length}</strong> equipo(s) seleccionados para tu clase.
          </div>
          <button className="doc-btn-primary" onClick={() => setPaso(5)}>Continuar</button>
        </div>
      )}

      {/* PASO 5: Confirmar */}
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
          <div className="doc-confirm-info" style={{ marginBottom:20,fontSize:13,opacity:0.7,fontStyle:'italic' }}>
            * La cantidad de alumnos se registra automáticamente según los equipos seleccionados ({activosSel.length}).
          </div>
          <div className="doc-dj-box">
            <div className="doc-dj-header" onClick={() => setShowDJ(!showDJ)}>
              <Icon.Shield />
              <span>Declaración Jurada Digital</span>
              <span style={{ marginLeft:'auto',fontSize:12,opacity:0.6 }}>{showDJ ? '▲ Ocultar' : '▼ Leer'}</span>
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
          <button className="doc-btn-primary" onClick={handleSubmitReserva} disabled={loading || !aceptaDJ}>
            {loading ? 'Creando…' : 'Confirmar Reserva'}
          </button>
        </div>
      )}
    </div>
  );
}

export default DocenteReservar;
