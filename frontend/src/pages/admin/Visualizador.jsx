import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import reservaService from "../../services/reservaService";
import laboratorioService from "../../services/laboratorioService";
import LabMap from "../../components/LabMap";
import { getLabLayout } from "../../components/labLayoutConfig";

function AdminVisualizador() {
  const { laboratorios, reservas, setReservaDetalleModal } = useOutletContext();

  const [visLab, setVisLab]         = useState(null);
  const [visFecha, setVisFecha]     = useState(new Date().toLocaleDateString('en-CA'));
  const [visHorarios, setVisHorarios]     = useState([]);
  const [visHorarioSel, setVisHorarioSel] = useState(null);
  const [visActivos, setVisActivos]       = useState([]);
  const [loadingVisHorarios, setLoadingVisHorarios] = useState(false);
  const [loadingVisGrid, setLoadingVisGrid]         = useState(false);

  useEffect(() => {
    if (!visLab || !visFecha) return;
    const load = async () => {
      setLoadingVisHorarios(true);
      setVisHorarios([]); setVisHorarioSel(null); setVisActivos([]);
      try {
        const data = await reservaService.getTodosLosHorariosPorLabYFecha(visLab.id_laboratorio, visFecha);
        setVisHorarios(data);
      } catch (err) { console.error(err); }
      finally { setLoadingVisHorarios(false); }
    };
    load();
  }, [visLab, visFecha]);

  useEffect(() => {
    if (!visHorarioSel || !visLab) { setVisActivos([]); return; }
    const load = async () => {
      setLoadingVisGrid(true); setVisActivos([]);
      try {
        const data = await laboratorioService.getActivosPorLab(visLab.id_laboratorio, visHorarioSel.id_horario);
        setVisActivos(data);
      } catch (err) { console.error(err); }
      finally { setLoadingVisGrid(false); }
    };
    load();
  }, [visHorarioSel, visLab]);

  const handleVisActivoSelect = async (activo) => {
    if (!activo?.id_reserva) return;
    const localRes = reservas.find(r => r.id_reserva === activo.id_reserva);
    if (localRes) {
      setReservaDetalleModal(localRes);
    } else {
      try {
        const data = await reservaService.getReservaById(activo.id_reserva);
        if (data) setReservaDetalleModal(data);
      } catch (err) {
        console.error(err);
        alert("No se pudo obtener la información de la reserva.");
      }
    }
  };

  return (
    <div className="table-section">
      <h2>Visualizador de Ocupación por Horarios</h2>
      <p style={{ opacity:0.7,marginBottom:20 }}>Consulta interactiva de puestos ocupados y disponibles en tiempo real.</p>

      <div style={{ display:'flex',gap:20,marginBottom:24,flexWrap:'wrap' }}>
        <div style={{ flex:1,minWidth:200 }}>
          <label style={{ display:'block',marginBottom:8,fontWeight:600 }}>Seleccionar Laboratorio</label>
          <select className="filter-select" style={{ width:'100%',padding:'10px 14px' }} value={visLab ? visLab.id_laboratorio : ''} onChange={e => { const lab = laboratorios.find(l => l.id_laboratorio === parseInt(e.target.value)); setVisLab(lab||null); }}>
            <option value="">Seleccione un laboratorio...</option>
            {laboratorios.map(lab => <option key={lab.id_laboratorio} value={lab.id_laboratorio}>{lab.nombre} ({lab.codigo_patrimonio})</option>)}
          </select>
        </div>
        <div style={{ width:180 }}>
          <label style={{ display:'block',marginBottom:8,fontWeight:600 }}>Fecha de Consulta</label>
          <input type="date" className="search-input" style={{ width:'100%',padding:'9px 12px' }} value={visFecha} onChange={e => setVisFecha(e.target.value)} />
        </div>
      </div>

      {visLab && (
        <div style={{ marginBottom:30 }}>
          <h3 style={{ borderBottom:'1px solid var(--border-color)',paddingBottom:8,marginBottom:12 }}>Bloques de Horarios</h3>
          {loadingVisHorarios ? (
            <div style={{ padding:20,opacity:0.6 }}>Cargando horarios...</div>
          ) : visHorarios.length > 0 ? (
            <div style={{ display:'flex',gap:12,flexWrap:'wrap' }}>
              {visHorarios.map(slot => {
                const isSel = visHorarioSel?.id_horario === slot.id_horario;
                const libres = slot.capacidad_total - (slot.capacidad_ocupada||0);
                return (
                  <button key={slot.id_horario} onClick={() => setVisHorarioSel(slot)} style={{ padding:'12px 18px',borderRadius:10,border: isSel ? '2px solid var(--accent-color)' : '1px solid var(--border-color)',background: isSel ? 'rgba(59,130,246,0.1)' : 'var(--bg-main)',color: isSel ? 'var(--accent-color)' : 'inherit',cursor:'pointer',textAlign:'left',minWidth:150,boxShadow:'0 2px 6px rgba(0,0,0,0.05)',transition:'all 0.2s' }}>
                    <strong style={{ display:'block',fontSize:14 }}>{slot.hora_inicio.substring(0,5)} - {slot.hora_fin.substring(0,5)}</strong>
                    <span style={{ fontSize:12,opacity:0.7,marginTop:4,display:'block' }}>{libres === 0 ? '🚫 Lleno' : `🟢 ${libres} libres`}</span>
                  </button>
                );
              })}
            </div>
          ) : <p style={{ opacity:0.6,fontSize:13 }}>No hay horarios programados para la fecha seleccionada.</p>}
        </div>
      )}

      {visHorarioSel && (
        <div style={{ borderTop:'1px solid var(--border-color)',paddingTop:20 }}>
          <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16 }}>
            <h3 style={{ margin:0 }}>Mapa del Laboratorio ({visHorarioSel.hora_inicio.substring(0,5)} - {visHorarioSel.hora_fin.substring(0,5)})</h3>
            <div style={{ fontSize:13,background:'rgba(59,130,246,0.1)',color:'var(--accent-color)',padding:'4px 12px',borderRadius:20,fontWeight:600 }}>
              Capacidad: {visHorarioSel.capacidad_total - (visHorarioSel.capacidad_ocupada||0)} / {visHorarioSel.capacidad_total} Libres
            </div>
          </div>
          {loadingVisGrid ? (
            <div style={{ textAlign:'center',padding:50,opacity:0.6 }}>Cargando grilla de puestos...</div>
          ) : visActivos.length > 0 ? (
            <div style={{ border:'1px solid var(--border-color)',borderRadius:12,padding:20,background:'var(--bg-main)' }}>
              <LabMap activos={visActivos} activoSel={null} onSelect={handleVisActivoSelect} {...getLabLayout(visLab?.codigo_patrimonio)} adminMode={false} />
            </div>
          ) : <p style={{ opacity:0.6 }}>No hay equipos cargados.</p>}
        </div>
      )}

      {!visLab && (
        <div style={{ textAlign:'center',padding:'60px 20px',background:'rgba(255,255,255,0.01)',borderRadius:12,border:'1px dashed var(--border-color)',marginTop:20 }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width:64,height:64,color:'var(--accent-color)',opacity:0.6,marginBottom:16 }}>
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
          </svg>
          <h3 style={{ margin:'0 0 8px 0',fontSize:18,color:'var(--text-main)' }}>Visualizador Físico de Laboratorios</h3>
          <p style={{ margin:0,opacity:0.7,maxWidth:500,marginLeft:'auto',marginRight:'auto',fontSize:14 }}>
            Seleccione un laboratorio, una fecha y el horario deseado para visualizar la distribución interactiva de los equipos.
          </p>
        </div>
      )}
    </div>
  );
}

export default AdminVisualizador;
