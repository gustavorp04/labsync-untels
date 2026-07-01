import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useNavigate, useOutletContext, useSearchParams } from "react-router-dom";
import laboratorioService from "../../services/laboratorioService";
import reservaService from "../../services/reservaService";
import LabMap from "../../components/LabMap";
import { getLabLayout } from "../../components/labLayoutConfig";

const Icon = {
  ChevronLeft: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>,
  Shield:  () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  Search:  () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
};

function EstudianteReservar() {
  const navigate = useNavigate();
  const { showToast, reservarKey } = useOutletContext() || {};
  const [searchParams] = useSearchParams();

  const userId  = localStorage.getItem("id_usuario") || "";
  const nombre  = localStorage.getItem("nombre")  || localStorage.getItem("username") || "Estudiante";
  const carrera = localStorage.getItem("carrera") || "";

  const normalize = useCallback((str) => (str || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""), []);
  const carreraNorm = useMemo(() => normalize(carrera), [carrera, normalize]);

  const tiposEspecialidad = useMemo(() => {
    if (carreraNorm.includes('sist')) return ['computo'];
    if (carreraNorm.includes('amb'))  return ['ambiental'];
    if (carreraNorm.includes('elec')) return ['electronica'];
    return [];
  }, [carreraNorm]);

  const tiposPermitidos = useMemo(() => [...tiposEspecialidad, 'fisica'], [tiposEspecialidad]);

  const [paso, setPaso]         = useState(() => parseInt(sessionStorage.getItem("est_paso")) || 1);
  const [laboratorios, setLaboratorios] = useState([]);
  const [horarios, setHorarios] = useState([]);
  const [activos, setActivos]   = useState([]);
  const [loading, setLoading]   = useState(false);

  const [labSel, setLabSel]         = useState(() => JSON.parse(sessionStorage.getItem("est_labSel")) || null);
  const [horarioSel, setHorarioSel] = useState(() => JSON.parse(sessionStorage.getItem("est_horarioSel")) || null);
  const [activoSel, setActivoSel]   = useState(() => JSON.parse(sessionStorage.getItem("est_activoSel")) || null);
  const [labSearchTerm, setLabSearchTerm] = useState("");
  const [diasVisibles, setDiasVisibles] = useState(5);

  const activoSelRef = useRef(activoSel);
  useEffect(() => { activoSelRef.current = activoSel; }, [activoSel]);

  const [aceptaDJ, setAceptaDJ] = useState(false);
  const [showDJ, setShowDJ]     = useState(false);
  const [inviteUrl, setInviteUrl] = useState('');
  const [copied, setCopied]       = useState(false);

  useEffect(() => { sessionStorage.setItem("est_paso",       paso.toString()); }, [paso]);
  useEffect(() => { sessionStorage.setItem("est_labSel",     JSON.stringify(labSel)); }, [labSel]);
  useEffect(() => { sessionStorage.setItem("est_horarioSel", JSON.stringify(horarioSel)); }, [horarioSel]);
  useEffect(() => { sessionStorage.setItem("est_activoSel",  JSON.stringify(activoSel)); }, [activoSel]);

  // Guard: reset step if prereqs are missing (F5 crash fix)
  useEffect(() => {
    if (paso === 2 && !labSel) setPaso(1);
    if (paso === 3 && (!labSel || !horarioSel)) setPaso(1);
    if (paso === 4 && (!labSel || !horarioSel || !activoSel)) setPaso(1);
  }, [paso, labSel, horarioSel, activoSel]);

  // Reiniciar al paso 1 cuando el usuario navega a /reservar desde el menú (misma ruta)
  useEffect(() => {
    if (!reservarKey) return;
    sessionStorage.removeItem('est_paso');
    sessionStorage.removeItem('est_labSel');
    sessionStorage.removeItem('est_horarioSel');
    sessionStorage.removeItem('est_activoSel');
    setPaso(1);
    setLabSel(null);
    setHorarioSel(null);
    setActivoSel(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reservarKey]);

  // Auto-fill from invite link (?lab=ID&horario=ID)
  useEffect(() => {
    const labId     = searchParams.get('lab');
    const horarioId = searchParams.get('horario');
    if (!labId || !horarioId || labSel || horarioSel) return;
    laboratorioService.getLaboratorios(tiposPermitidos)
      .then(labs => {
        const lab = labs.find(l => String(l.id_laboratorio) === labId);
        if (!lab) return;
        setLabSel(lab);
        reservaService.getHorariosPorLab(lab.id_laboratorio).then(slots => {
          const slot = slots.find(h => String(h.id_horario) === horarioId);
          if (slot && slot.es_reservable) { setHorarioSel(slot); setPaso(3); }
          else setPaso(2);
        }).catch(() => setPaso(2));
      })
      .catch(() => {});
  // run once on mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load labs on step 1
  useEffect(() => {
    const abortCtrl = new AbortController();
    setLoading(true);
    laboratorioService.getLaboratorios(tiposPermitidos, { signal: abortCtrl.signal })
      .then(data => setLaboratorios(data))
      .catch(err => { if (err.name !== 'CanceledError' && err.code !== 'ERR_CANCELED') showToast('error', 'Error al cargar laboratorios'); })
      .finally(() => setLoading(false));
    return () => abortCtrl.abort();
  }, [tiposPermitidos, tiposEspecialidad.length, showToast]);

  // Load horarios on step 2
  useEffect(() => {
    if (paso === 2 && labSel) {
      setHorarios([]);
      setDiasVisibles(5);
      setLoading(true);
      reservaService.getHorariosPorLab(labSel.id_laboratorio)
        .then(data => setHorarios(data))
        .catch(() => showToast('error', 'Error al cargar horarios'))
        .finally(() => setLoading(false));
    }
  }, [paso, labSel, showToast]);

  // Load activos + polling on step 3
  useEffect(() => {
    if (!(paso === 3 && labSel && horarioSel)) return;
    let intervalId = null;
    let isLoading = false;
    const abortCtrl = new AbortController();

    const cargarEquipos = async (showLoading = false) => {
      if (!showLoading && isLoading) return;
      isLoading = true;
      if (showLoading) setLoading(true);
      try {
        const data = await laboratorioService.getActivosPorLab(labSel.id_laboratorio, horarioSel.id_horario, { signal: abortCtrl.signal });
        setActivos(data);
        if (activoSelRef.current) {
          const pc = data.find(a => a.id_activo === activoSelRef.current.id_activo);
          if (pc && (pc.reservado || pc.estado_reserva === "Pendiente" || pc.estado !== "Operativo")) {
            setActivoSel(null);
            showToast('error', 'El equipo seleccionado ha sido reservado o inhabilitado por otro usuario.');
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
    intervalId = setInterval(() => cargarEquipos(false), 5000);
    return () => { if (intervalId) clearInterval(intervalId); abortCtrl.abort(); };
  }, [paso, labSel, horarioSel, showToast]);

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
      const url = `${window.location.origin}/estudiante/reservar?lab=${labSel.id_laboratorio}&horario=${horarioSel.id_horario}`;
      setInviteUrl(url);
      setPaso(5);
    } catch (err) {
      showToast('error', err.response?.data?.error || 'Error al reservar.');
    } finally {
      setLoading(false);
    }
  };

  const horariosByDate = horarios.reduce((acc, h) => {
    if (!acc[h.fecha]) acc[h.fecha] = [];
    acc[h.fecha].push(h);
    return acc;
  }, {});

  return (
    <div className="est-wizard">
      {/* PASO 1 */}
      {paso === 1 && (
        <div className="est-section">
          <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20 }}>
            <h2>Selecciona un Laboratorio</h2>
            <div className="doc-search-box">
              <Icon.Search />
              <input type="text" placeholder="Buscar por código o nombre..." value={labSearchTerm} onChange={e => setLabSearchTerm(e.target.value)} />
            </div>
          </div>
          {loading ? <div className="est-loading">Cargando laboratorios...</div> : (
            <div className="est-lab-grid">
              {laboratorios.filter(lab => {
                const term = labSearchTerm.toLowerCase();
                return (lab.nombre||'').toLowerCase().includes(term) || (lab.codigo_patrimonio||'').toLowerCase().includes(term);
              }).map(lab => (
                <button key={lab.id_laboratorio} className="est-lab-card" onClick={() => { setLabSel(lab); setHorarioSel(null); setActivoSel(null); setPaso(2); }}>
                  <div className="est-lab-name">{lab.nombre}</div>
                  <div className="est-lab-foot">🖥 {lab.equipos_operativos}/{lab.aforo_maximo} operativos</div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* PASO 2 */}
      {paso === 2 && (
        <div className="est-section">
          <button className="est-back" onClick={() => setPaso(1)} style={{ marginBottom:16 }}><Icon.ChevronLeft /> Volver</button>
          <h2>Horarios Disponibles</h2>
          {(() => {
            const dias = Object.entries(horariosByDate);
            const visibles = dias.slice(0, diasVisibles);
            const restantes = dias.length - visibles.length;
            return (
            <>
            <div className="est-calendar est-calendar-scroll">
              {visibles.map(([fecha, slots]) => (
                <div key={fecha} className="est-cal-day">
                  <div className="est-cal-date">{fecha}</div>
                  <div className="est-cal-slots">
                    {slots.map(h => (
                      <button
                        key={h.id_horario}
                        className={`est-cal-slot ${!h.es_reservable ? 'blocked' : ''}`}
                        onClick={() => { if (!h.es_reservable) return; setHorarioSel(h); setActivoSel(null); setPaso(3); }}
                        disabled={!h.es_reservable}
                        title={!h.es_reservable ? "Bloqueado por límite de 24h" : ""}
                      >
                        {h.hora_inicio.slice(0,5)} - {h.hora_fin.slice(0,5)}
                        {!h.es_reservable && <span style={{display:'block',fontSize:10,opacity:0.6}}>Bloqueado</span>}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              {!loading && dias.length === 0 && (
                <p className="est-empty">No hay horarios disponibles para este laboratorio.</p>
              )}
            </div>
            {restantes > 0 && (
              <button className="est-btn-secondary" style={{ marginTop: 12 }} onClick={() => setDiasVisibles(v => v + 5)}>
                Ver más días ({restantes})
              </button>
            )}
            </>
            );
          })()}
        </div>
      )}

      {/* PASO 3 */}
      {paso === 3 && (
        <div className="est-section">
          <button className="est-back" onClick={() => setPaso(2)} style={{ marginBottom:16 }}><Icon.ChevronLeft /> Volver</button>
          <h2>Mapa de Equipos</h2>
          <LabMap activos={activos} activoSel={activoSel} onSelect={setActivoSel} {...getLabLayout(labSel?.codigo_patrimonio)} />

          {activoSel && (
            <div className="est-activo-panel">
              <div className="est-activo-panel-header">
                <div className="est-activo-panel-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{width:20,height:20}}><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="8" y="8" width="8" height="8"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="12" y1="1" x2="12" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="12" y1="20" x2="12" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/><line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="12" x2="4" y2="12"/><line x1="1" y1="15" x2="4" y2="15"/><line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="12" x2="23" y2="12"/><line x1="20" y1="15" x2="23" y2="15"/></svg>
                </div>
                <div className="est-activo-panel-title">
                  <strong>{activoSel.tipo_activo_nombre || 'Equipo'}</strong>
                  <span className="est-activo-badge"><span style={{width:7,height:7,borderRadius:'50%',background:'#10b981',display:'inline-block',marginRight:4}}/>Operativo</span>
                </div>
                <button className="est-activo-panel-close" onClick={() => setActivoSel(null)}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
              <div className="est-activo-panel-body">
                <div className="est-activo-chips">
                  <div className="est-activo-chip"><span className="est-activo-chip-label">Código</span><strong>{activoSel.codigo_patrimonio||'—'}</strong></div>
                  <div className="est-activo-chip"><span className="est-activo-chip-label">N° Serie</span><strong>{activoSel.num_serie||'—'}</strong></div>
                </div>
                {(() => {
                  const puestoNum = activoSel.num_serie?.split('-').slice(-1)[0];
                  if (!puestoNum) return null;
                  const perifericos = activos.filter(a => a.id_activo !== activoSel.id_activo && a.num_serie?.endsWith(`-${puestoNum}`));
                  if (!perifericos.length) return null;
                  return (
                    <div className="est-perifericos">
                      <div className="est-perifericos-title">Periféricos incluidos en el puesto:</div>
                      {perifericos.map(p => (
                        <div key={p.id_activo} className="est-periferico-row">
                          <span className="est-periferico-tipo">{p.tipo_activo_nombre}</span>
                          <span className="est-periferico-serie">{p.num_serie}</span>
                          <span className={`est-periferico-dot ${p.estado==='Operativo'?'ok':'bad'}`}/>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            </div>
          )}
          <button className="est-btn-primary" onClick={() => setPaso(4)} disabled={!activoSel}>Continuar</button>
        </div>
      )}

      {/* PASO 5 — Sala de espera / Invite link */}
      {paso === 5 && (
        <div className="est-section est-confirm">
          <div className="est-waitroom">
            <div className="est-waitroom-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" width="40" height="40">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
            </div>
            <h2 className="est-waitroom-title">¡Reserva registrada!</h2>
            <p className="est-waitroom-sub">
              Tu reserva está en estado <strong>Pendiente</strong>.<br/>
              Necesitás que <strong>10 alumnos reserven el mismo horario</strong> en los próximos <strong>5 minutos</strong> para que quede confirmada.
            </p>

            <div className="est-waitroom-info">
              <div className="est-waitroom-row"><span>Laboratorio</span><strong>{labSel?.nombre}</strong></div>
              <div className="est-waitroom-row"><span>Fecha</span><strong>{horarioSel?.fecha}</strong></div>
              <div className="est-waitroom-row"><span>Horario</span><strong>{horarioSel?.hora_inicio?.slice(0,5)} – {horarioSel?.hora_fin?.slice(0,5)}</strong></div>
            </div>

            <div className="est-waitroom-invite">
              <div className="est-waitroom-invite-label">Compartí este link con tus compañeros:</div>
              <div className="est-waitroom-link-row">
                <input readOnly value={inviteUrl} className="est-waitroom-link-input" onClick={e => e.target.select()} />
                <button
                  className="est-waitroom-copy"
                  onClick={() => {
                    navigator.clipboard.writeText(inviteUrl).then(() => {
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    });
                  }}
                >
                  {copied ? '✓ Copiado' : 'Copiar'}
                </button>
              </div>
              <a
                className="est-waitroom-wa"
                href={`https://wa.me/?text=${encodeURIComponent(`¡Únete a mi reserva en LabSync UNTELS! Lab: ${labSel?.nombre} · ${horarioSel?.fecha} ${horarioSel?.hora_inicio?.slice(0,5)}–${horarioSel?.hora_fin?.slice(0,5)}\n${inviteUrl}`)}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18" style={{ flexShrink: 0 }}>
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                Compartir por WhatsApp
              </a>
            </div>

            <button
              className="est-btn-secondary"
              style={{ marginTop: 8 }}
              onClick={() => { setPaso(1); navigate('/estudiante/mis-reservas'); }}
            >
              Ver mis reservas
            </button>
          </div>
        </div>
      )}

      {/* PASO 4 */}
      {paso === 4 && (
        <div className="est-section est-confirm">
          <button className="est-back" onClick={() => setPaso(3)} style={{ marginBottom:16 }}><Icon.ChevronLeft /> Volver</button>
          <h2>Confirmar Reserva</h2>
          <div className="est-confirm-card">
            <div className="est-confirm-row"><span>Laboratorio</span><strong>{labSel?.nombre}</strong></div>
            <div className="est-confirm-row"><span>Código</span><strong>{labSel?.codigo_patrimonio}</strong></div>
            <div className="est-confirm-row"><span>Fecha</span><strong>{horarioSel?.fecha}</strong></div>
            <div className="est-confirm-row"><span>Horario</span><strong>{horarioSel?.hora_inicio?.slice(0,5)} – {horarioSel?.hora_fin?.slice(0,5)}</strong></div>
            <div className="est-confirm-row"><span>Equipo</span><strong>{activoSel?.codigo_patrimonio||activoSel?.num_serie||'1 equipo'}</strong></div>
          </div>

          <div className="est-dj-box">
            <div className="est-dj-header" onClick={() => setShowDJ(!showDJ)} style={{ cursor:'pointer',display:'flex',alignItems:'center',gap:8 }}>
              <Icon.Shield />
              <span>Declaración Jurada Digital</span>
              <span style={{ marginLeft:'auto',fontSize:12,opacity:0.6 }}>{showDJ ? '▲ Ocultar' : '▼ Leer'}</span>
            </div>
            {showDJ && (
              <div className="est-dj-text" style={{ marginTop:12 }}>
                <p>Yo, <strong>{nombre}</strong>, declaro bajo juramento que:</p>
                <ol style={{ paddingLeft:20,marginTop:8 }}>
                  <li style={{ marginBottom:6 }}>Asumo plena responsabilidad sobre el equipo <strong>{activoSel?.codigo_patrimonio||'asignado'}</strong> del laboratorio <strong>{labSel?.nombre}</strong> durante el horario reservado.</li>
                  <li style={{ marginBottom:6 }}>Me comprometo a reportar cualquier daño, rayadura o anomalía física al asistente de laboratorio de forma inmediata.</li>
                  <li style={{ marginBottom:6 }}>El equipo informático será utilizado exclusivamente para fines académicos y de investigación.</li>
                  <li style={{ marginBottom:6 }}>Entiendo que el mal uso, retiro de periféricos o daños intencionales generará la cancelación de mi acceso y las penalizaciones académicas correspondientes.</li>
                </ol>
              </div>
            )}
            <label className="est-dj-check" style={{ display:'flex',alignItems:'center',gap:10,marginTop:12,cursor:'pointer' }}>
              <input type="checkbox" checked={aceptaDJ} onChange={e => setAceptaDJ(e.target.checked)} style={{ cursor:'pointer' }} />
              <span>He leído y acepto la Declaración Jurada de Responsabilidad Estudiantil</span>
            </label>
          </div>

          <button className="est-btn-primary" onClick={handleSubmitReserva} disabled={loading || !aceptaDJ}>
            {loading ? 'Procesando...' : 'Confirmar y Finalizar Reserva'}
          </button>
        </div>
      )}
    </div>
  );
}

export default EstudianteReservar;
