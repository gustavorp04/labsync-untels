import { useMemo } from "react";
import { Monitor } from "lucide-react";
import "./LabMap.css";

/**
 * LabMap — Mapa interactivo Universal
 */
export default function LabMap({ activos = [], activoSel, onSelect, columnas = 6 }) {
  
  const pcs = useMemo(
    () => activos.filter((a) => a.tipo_activo_nombre === "CPU" || a.tipo_activo_nombre === "Mesa"),
    [activos]
  );

  const filas = useMemo(() => {
    const rows = [];
    for (let i = 0; i < pcs.length; i += columnas) {
      const letra = String.fromCharCode(65 + rows.length);
      rows.push({ letra, items: pcs.slice(i, i + columnas) });
    }
    return rows;
  }, [pcs, columnas]);

  const isSelected = (a) => {
    if (Array.isArray(activoSel)) return activoSel.includes(a.id_activo);
    return activoSel?.id_activo === a.id_activo;
  };

  function getEstado(a) {
    if (isSelected(a)) return "selected";
    if (a.estado_reserva === "Pendiente") return "pending"; 
    if (a.reservado) return "occupied"; 
    if (a.estado === "Mantenimiento") return "maintenance";
    if (a.estado !== "Operativo") return "broken";
    return "available";
  }

  function handleClick(a) {
    if (a.estado !== "Operativo" || a.reservado || a.estado_reserva === "Pendiente") return;
    
    // Si es array (Docente), pasamos el objeto y el padre decide si agregar/quitar
    if (Array.isArray(activoSel)) {
      onSelect(a);
    } else {
      // Si es objeto (Estudiante), alternamos entre el objeto y null
      onSelect(isSelected(a) ? null : a);
    }
  }

  return (
    <div className="lm-wrapper">
      <div className="lm-front-bar">PANTALLA / PIZARRA</div>

      <div className="lm-grid-area">
        {filas.map((fila) => (
          <div key={fila.letra} className="lm-row">
            <div className="lm-row-label">{fila.letra}</div>

            <div className="lm-row-pcs">
              {fila.items.map((a) => {
                const estado = getEstado(a);
                const shortCode = a.codigo_patrimonio?.split("-").slice(-1)[0] || '—';
                
                return (
                  <button
                    key={a.id_activo}
                    className={`lm-pc lm-pc--${estado}`}
                    onClick={() => handleClick(a)}
                    disabled={estado === "broken" || estado === "occupied" || estado === "maintenance" || estado === "pending"}
                    title={a.num_serie || 'Sin código'}
                  >
                    <div className="lm-pc-icon-wrapper">
                      <Monitor 
                        size={32} 
                        strokeWidth={1.5}
                        fill={estado === "available" ? "none" : "currentColor"} 
                      />
                    </div>
                    <span className="lm-pc-number">{shortCode}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="lm-legend">
        <div className="lm-legend-item"><Monitor size={16} strokeWidth={1.5} fill="none" className="legend-icon available" /> Disponible</div>
        <div className="lm-legend-item"><Monitor size={16} strokeWidth={1.5} fill="currentColor" className="legend-icon selected" /> Tu selección</div>
        <div className="lm-legend-item"><Monitor size={16} strokeWidth={1.5} fill="currentColor" className="legend-icon occupied" /> Clase Reservada</div>
        <div className="lm-legend-item"><Monitor size={16} strokeWidth={1.5} fill="currentColor" className="legend-icon pending" /> Estudiante (Pendiente)</div>
        <div className="lm-legend-item"><Monitor size={16} strokeWidth={1.5} fill="currentColor" className="legend-icon maintenance" /> Mantenimiento</div>
        <div className="lm-legend-item"><Monitor size={16} strokeWidth={1.5} fill="currentColor" className="legend-icon broken" /> Dado de baja</div>
      </div>
    </div>
  );
}
