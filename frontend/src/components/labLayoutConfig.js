/**
 * labLayoutConfig.js
 * Configuración de layout físico por laboratorio.
 *
 * columnas        : PCs / Mesas por fila (sin contar el pasillo).
 * gapAfterColumn  : Después de qué activo (1-based) va el pasillo central.
 *                   null = sin pasillo.
 */
const LAB_LAYOUTS = {

  // ── Cómputo Bloque A (30 CPUs c/u → 6 filas × 5) ─────────────────
  'A1-1':  { columnas: 5, gapAfterColumn: null },
  'A1-2':  { columnas: 5, gapAfterColumn: null },
  'A1-3':  { columnas: 5, gapAfterColumn: null },
  'A2-3':  { columnas: 5, gapAfterColumn: null },
  'A2-4':  { columnas: 5, gapAfterColumn: null },

  // ── Cómputo Bloque C (24 CPUs → 4 filas × 6 con pasillo) ──────────
  'C2-2A': { columnas: 6, gapAfterColumn: 3 },
  'C2-2B': { columnas: 6, gapAfterColumn: 3 },

  // ── Cómputo Georeferenciados (20 CPUs → 4 filas × 5) ──────────────
  'C3-3':  { columnas: 5, gapAfterColumn: null },

  // ── Física (12 mesas c/u → 3 filas × 4) ───────────────────────────
  'FIS-G1': { columnas: 4, gapAfterColumn: null, labType: 'mesa' },
  'FIS-G2': { columnas: 4, gapAfterColumn: null, labType: 'mesa' },

  // ── Electrónica — mesas ────────────────────────────────────────────
  // ELE-AD: 12 mesas → 3 filas × 4
  'ELE-AD': { columnas: 4, gapAfterColumn: null, labType: 'mesa' },
  // ELE-CA: 10 mesas → 2 filas × 5
  'ELE-CA': { columnas: 5, gapAfterColumn: null, labType: 'mesa' },
  // B1-4: 10 mesas → 2 filas × 5
  'B1-4':  { columnas: 5, gapAfterColumn: null, labType: 'mesa' },
  // B2-4: 15 mesas → 3 filas × 5
  'B2-4':  { columnas: 5, gapAfterColumn: null, labType: 'mesa' },
  // B3-9: 15 mesas → 3 filas × 5
  'B3-9':  { columnas: 5, gapAfterColumn: null, labType: 'mesa' },

  // ── Ambiental / Química — mesas ────────────────────────────────────
  // C2-4 (Biología): 10 mesas → 2 filas × 5
  'C2-4':  { columnas: 5, gapAfterColumn: null, labType: 'mesa' },
  // C1-2B (Química): 9 mesas → 3 filas × 3
  'C1-2B': { columnas: 3, gapAfterColumn: null, labType: 'mesa' },
  // C2-3 (Química Ambiental): 10 mesas → 2 filas × 5
  'C2-3':  { columnas: 5, gapAfterColumn: null, labType: 'mesa' },
};

const DEFAULT_LAYOUT = { columnas: 5, gapAfterColumn: null };


/**
 * Retorna { columnas, gapAfterColumn } para el código de patrimonio dado.
 * @param {string|null|undefined} codigo
 * @returns {{ columnas: number, gapAfterColumn: number|null }}
 */
export function getLabLayout(codigo) {
  if (!codigo) return DEFAULT_LAYOUT;
  return LAB_LAYOUTS[codigo] ?? DEFAULT_LAYOUT;
}
