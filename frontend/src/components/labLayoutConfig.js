/**
 * labLayoutConfig.js
 * Configuración de layout físico por laboratorio.
 *
 * columnas        : PCs / Mesas por fila (sin contar el pasillo).
 * gapAfterColumn  : Después de qué activo (1-based) va el pasillo central.
 *                   null = sin pasillo.
 */
const LAB_LAYOUTS = {
  // ── Bloque A — Cómputo (5 PCs por fila, sin pasillo) ──────────────
  'A1-1':  { columnas: 5, gapAfterColumn: null },
  'A1-2':  { columnas: 5, gapAfterColumn: null },
  'A1-3':  { columnas: 5, gapAfterColumn: null },
  'A2-3':  { columnas: 5, gapAfterColumn: null },
  'A2-4':  { columnas: 5, gapAfterColumn: null },

  // ── Bloque B — Cómputo ────────────────────────────────────────────
  // ⚠️ Filas mixtas A,B=3+3 / C=4+4 — aprox. 7 cols gap@4 (7+7+6=20)
  'B1-4':  { columnas: 7, gapAfterColumn: 4 },
  // 6 filas × (3+3) con pasillo central
  'B2-4':  { columnas: 6, gapAfterColumn: 3 },
  'B3-9':  { columnas: 6, gapAfterColumn: 3 },

  // ── Bloque C — Cómputo ────────────────────────────────────────────
  // ⚠️ Filas mixtas — aprox. 7 cols gap@4
  'C1-2B': { columnas: 7, gapAfterColumn: 4 },
  // 3 filas × (3+3) con pasillo
  'C2-2A': { columnas: 6, gapAfterColumn: 3 },
  'C2-2B': { columnas: 6, gapAfterColumn: 3 },
  // ⚠️ Filas mixtas — aprox. 7 cols gap@4
  'C2-3':  { columnas: 7, gapAfterColumn: 4 },
  'C2-4':  { columnas: 7, gapAfterColumn: 4 },
  'C3-3':  { columnas: 7, gapAfterColumn: 4 },

  // ── Laboratorios de Física (Sillas/puestos, 6 por mesa → columnas=6) ──
  // Cada fila = 1 mesa de trabajo (6 sillas × ~4 mesas = aforo 25)
  'FIS-G1': { columnas: 6, gapAfterColumn: null },
  'FIS-G2': { columnas: 6, gapAfterColumn: null },

  // ── Laboratorios de Electrónica (Sillas/puestos, 5 por mesa) ─────────
  // Cada fila = 1 mesa de trabajo (5 sillas × 4-5 mesas = aforo 20-25)
  'ELE-AD': { columnas: 5, gapAfterColumn: null },
  'ELE-CA': { columnas: 5, gapAfterColumn: null },
};

/** Valor por defecto para labs no configurados aún */
const DEFAULT_LAYOUT = { columnas: 6, gapAfterColumn: 3 };

/**
 * Retorna { columnas, gapAfterColumn } para el código de patrimonio dado.
 * @param {string|null|undefined} codigo
 * @returns {{ columnas: number, gapAfterColumn: number|null }}
 */
export function getLabLayout(codigo) {
  if (!codigo) return DEFAULT_LAYOUT;
  return LAB_LAYOUTS[codigo] ?? DEFAULT_LAYOUT;
}
