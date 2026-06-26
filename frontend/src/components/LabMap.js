import React, { useMemo } from "react";
import { Monitor, Table2, Armchair } from "lucide-react";
import "./LabMap.css";

/**
 * LabMap — Mapa interactivo Universal
 * Soporta labs de cómputo (CPU) y labs especializados (Mesa / Silla).
 * labType: 'silla' | 'mesa' | undefined — sobreescribe la detección automática.
 */
export default function LabMap({ activos = [], activoSel, onSelect, columnas = 6, gapAfterColumn = null, adminMode = false, labType }) {

  const pcs = useMemo(
    () => activos.filter((a) => {
      const typeName = a.tipo_activo || a.tipo_activo_nombre;
      return typeName === "CPU" || typeName === "Mesa" || typeName === "Silla";
    }),
    [activos]
  );

  /**
   * Tipo de lab — usa el prop labType si se provee,
   * si no, intenta inferirlo del tipo_activo de los assets.
   */
  const resolvedLabType = useMemo(() => {
    if (labType) return labType;                          // prop explícito (desde labLayoutConfig)
    if (pcs.length === 0) return 'cpu';
    const allMesa  = pcs.every(p => (p.tipo_activo || p.tipo_activo_nombre) === 'Mesa');
    const allSilla = pcs.every(p => (p.tipo_activo || p.tipo_activo_nombre) === 'Silla');
    if (allSilla) return 'silla';
    if (allMesa)  return 'mesa';
    return 'cpu';
  }, [labType, pcs]);

  const isSillaLab   = resolvedLabType === 'silla';
  const isMesaLab    = resolvedLabType === 'mesa';
  const isSpecialLab = isSillaLab || isMesaLab;

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
        const letra = String.fromCharCode(64 + f);
        const items = [];
        for (let c = 1; c <= maxColumna; c++) {
          const pc = pcs.find(p => p.fila === f && p.columna === c);
          items.push(pc || null);
        }
        rows.push({ letra, items });
      }
    } else {
      for (let i = 0; i < pcs.length; i += columnas) {
        const letra = String.fromCharCode(65 + rows.length);
        const chunk = pcs.slice(i, i + columnas);
        const items = [];
        chunk.forEach((pc, idx) => {
          items.push(pc);
          // Insert gap AFTER the Nth PC (gapAfterColumn is 1-based count)
          if (gapAfterColumn !== null && idx + 1 === gapAfterColumn) {
            items.push(null); // Insert gap/pasillo
          }
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

  /* ── Silla / puesto card (icono pequeño estilo PC) ────────────────── */
  function SillaCard({ a }) {
    const estado = getEstado(a);
    const num = a.codigo_patrimonio?.split("-").slice(-1)[0] || "—";
    return (
      <button
        className={`lm-pc lm-pc--${estado}`}
        onClick={() => handleClick(a)}
        disabled={!adminMode && (estado === "broken" || estado === "occupied" || estado === "maintenance" || estado === "pending")}
        title={a.num_serie || "Sin código"}
      >
        <div className="lm-pc-icon-wrapper">
          <Armchair
            size={28}
            strokeWidth={1.5}
            fill={estado === "available" ? "none" : "currentColor"}
          />
        </div>
        <span className="lm-pc-number">{num}</span>
      </button>
    );
  }

  /* ── Mesa de trabajo card ──────────────────────────────────────────── */
  function MesaCard({ a }) {
    const estado = getEstado(a);
    const num = a.codigo_patrimonio?.split("-").slice(-1)[0] || "—";
    return (
      <button
        className={`lm-mesa lm-mesa--${estado}`}
        onClick={() => handleClick(a)}
        disabled={!adminMode && (estado === "broken" || estado === "occupied" || estado === "maintenance" || estado === "pending")}
        title={a.num_serie || "Sin código"}
      >
        <div className="lm-mesa-icon">
          <Table2 size={36} strokeWidth={1.4} />
        </div>
        <span className="lm-mesa-label">Mesa {num}</span>
        <span className={`lm-mesa-badge lm-mesa-badge--${estado}`}>
          {estado === "available" && "Disponible"}
          {estado === "selected" && "Seleccionada"}
          {estado === "occupied" && "Reservada"}
          {estado === "pending" && "Pendiente"}
          {estado === "maintenance" && "Mantenimiento"}
          {estado === "broken" && "Baja"}
        </span>
      </button>
    );
  }

  /* ── PC / Monitor card ─────────────────────────────────────────────── */
  const PC_ESTADO_LABEL = {
    available:   'Libre',
    selected:    'Seleccionado',
    occupied:    'Reservado',
    pending:     'Pendiente',
    maintenance: 'Mantenimiento',
    broken:      'Baja',
    empty:       '',
  };

  function PcCard({ a }) {
    const estado = getEstado(a);
    const shortCode = a.codigo_patrimonio?.split("-").slice(-1)[0] || "—";
    const estadoLabel = PC_ESTADO_LABEL[estado] || '';
    return (
      <button
        className={`lm-pc lm-pc--${estado}`}
        onClick={() => handleClick(a)}
        disabled={!adminMode && (estado === "broken" || estado === "occupied" || estado === "maintenance" || estado === "pending")}
        aria-label={`Puesto ${shortCode}${estadoLabel ? ` — ${estadoLabel}` : ''}`}
      >
        <div className="lm-pc-icon-wrapper">
          <Monitor
            size={32}
            strokeWidth={1.5}
            fill={estado === "available" ? "none" : "currentColor"}
          />
        </div>
        <span className="lm-pc-number">{shortCode}</span>
        <span className={`lm-pc-badge lm-pc-badge--${estado}`}>{estadoLabel}</span>
      </button>
    );
  }

  /* ── Leyenda adaptativa ────────────────────────────────────────────── */
  const LegendIcon = isMesaLab
    ? () => <Table2 size={16} strokeWidth={1.5} />
    : isSillaLab
      ? () => <Armchair size={16} strokeWidth={1.5} />
      : ({ fill }) => <Monitor size={16} strokeWidth={1.5} fill={fill || "none"} />;

  return (
    <div className={`lm-wrapper${isSpecialLab ? " lm-wrapper--mesa-lab" : ""}`}>
      {!isSpecialLab && (
        <div className="lm-front-bar">PANTALLA / PIZARRA</div>
      )}
      {isMesaLab && (
        <div className="lm-front-bar lm-front-bar--mesa">LAB ESPECIALIZADO — Mesas de Trabajo</div>
      )}
      {isSillaLab && (
        <div className="lm-front-bar lm-front-bar--mesa">LAB ESPECIALIZADO — Puestos / Sillas</div>
      )}

      <div className={`lm-grid-area${isMesaLab ? " lm-grid-area--mesa" : ""}`}>
        {filas.map((fila) => (
          <div key={fila.letra} className="lm-row">
            {!isSpecialLab && <div className="lm-row-label">{fila.letra}</div>}
            {isSillaLab && <div className="lm-row-label lm-row-label--mesa">{fila.letra}</div>}

            <div className={`lm-row-pcs${isMesaLab ? " lm-row-pcs--mesa" : ""}`}>
              {fila.items.map((a, index) => {
                if (!a) {
                  return (
                    <div key={`empty-${fila.letra}-${index}`} className="lm-empty-cell">
                      <span className="lm-gap-text">pasillo</span>
                    </div>
                  );
                }
                if (isMesaLab)  return <MesaCard  key={a.id_activo} a={a} />;
                if (isSillaLab) return <SillaCard key={a.id_activo} a={a} />;
                return <PcCard key={a.id_activo} a={a} />;
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="lm-legend">
        <div className="lm-legend-item"><span className="available"><LegendIcon fill="none" /></span> Disponible</div>
        <div className="lm-legend-item"><span className="selected"><LegendIcon fill="currentColor" /></span> Tu selección</div>
        <div className="lm-legend-item"><span className="occupied"><LegendIcon fill="currentColor" /></span> Clase Reservada</div>
        <div className="lm-legend-item"><span className="pending"><LegendIcon fill="currentColor" /></span> Pendiente</div>
        <div className="lm-legend-item"><span className="maintenance"><LegendIcon fill="currentColor" /></span> Mantenimiento</div>
        <div className="lm-legend-item"><span className="broken"><LegendIcon fill="currentColor" /></span> Dado de baja</div>
      </div>
    </div>
  );
}
