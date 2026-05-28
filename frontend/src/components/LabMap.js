import React, { useMemo } from "react";
import { Monitor } from "lucide-react";
import "./LabMap.css";

/**
 * LabMap — Mapa interactivo Universal
 */
export default function LabMap({ activos = [], activoSel, onSelect, columnas = 6, gapAfterColumn = null, adminMode = false }) {
  
  const pcs = useMemo(
    () => activos.filter((a) => {
      const typeName = a.tipo_activo || a.tipo_activo_nombre;
      return typeName === "CPU" || typeName === "Mesa";
    }),
    [activos]
  );

  const hasCoordinates = useMemo(
    () => pcs.length > 0 && pcs.every(p => p.fila != null && p.columna != null),
    [pcs]
  );

  const filas = useMemo(() => {
    const rows = [];
    if (hasCoordinates) {
      const maxFila = Math.max(...pcs.map(p => p.fila));
      const maxColumna = Math.max(...pcs.map(p => p.columna));

      for (let f = 1; f <= maxFila; f++) {
        const letra = String.fromCharCode(64 + f); // 1->A, 2->B, etc.
        const items = [];
        for (let c = 1; c <= maxColumna; c++) {
          const pc = pcs.find(p => p.fila === f && p.columna === c);
          items.push(pc || null); // null represents an empty spot / gap
        }
        rows.push({ letra, items });
      }
    } else {
      for (let i = 0; i < pcs.length; i += columnas) {
        const letra = String.fromCharCode(65 + rows.length);
        const chunk = pcs.slice(i, i + columnas);
        const items = [];
        chunk.forEach((pc, idx) => {
          if (gapAfterColumn !== null && idx === gapAfterColumn) {
            items.push(null); // Insert gap
          }
          items.push(pc);
        });
        rows.push({ letra, items });
      }
    }
    return rows;
  }, [pcs, columnas, hasCoordinates, gapAfterColumn]);

  const isSelected = (a) => {
    if (!a) return false;
    if (Array.isArray(activoSel)) return activoSel.includes(a.id_activo);
    return activoSel?.id_activo === a.id_activo;
  };

  function getEstado(a) {
    if (!a) return "empty";
    if (isSelected(a)) return "selected";
    if (a.estado_reserva === "Pendiente") return "pending"; 
    if (a.reservado) return "occupied"; 
    if (a.estado === "Mantenimiento") return "maintenance";
    if (a.estado !== "Operativo") return "broken";
    return "available";
  }

  function handleClick(a) {
    if (!a) return;
    if (adminMode) {
      onSelect(isSelected(a) ? null : a);
      return;
    }
    if (a.estado !== "Operativo" || a.reservado || a.estado_reserva === "Pendiente") return;
    
    if (Array.isArray(activoSel)) {
      onSelect(a);
    } else {
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
              {fila.items.map((a, index) => {
                if (!a) {
                  return (
                    <div key={`empty-${fila.letra}-${index}`} className="lm-empty-cell">
                      <span className="lm-gap-text">pasillo</span>
                    </div>
                  );
                }

                const estado = getEstado(a);
                const shortCode = a.codigo_patrimonio?.split("-").slice(-1)[0] || '—';
                
                return (
                  <button
                    key={a.id_activo}
                    className={`lm-pc lm-pc--${estado}`}
                    onClick={() => handleClick(a)}
                    disabled={!adminMode && (estado === "broken" || estado === "occupied" || estado === "maintenance" || estado === "pending")}
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
