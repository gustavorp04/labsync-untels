import api from "./api";

/** Lista laboratorios con estado calculado.
 * ID-07: si se pasan tiposPermitidos, el filtro se aplica en el servidor,
 * nunca en el cliente (no es bypasseable desde el navegador).
 * M-2: acepta options.signal para cancelar la petición con AbortController. */
const getLaboratorios = async (tiposPermitidos = [], options = {}) => {
  const params = tiposPermitidos.length > 0
    ? `?tipo_nombres=${tiposPermitidos.join(',')}`
    : '';
  const res = await api.get(`/v1/laboratorios/${params}`, { signal: options.signal });
  return res.data;
};

/** Lista los activos (PCs/Mesas) de un laboratorio.
 * Si se envía idHorario, el backend marca cuáles están reservados.
 * M-2: acepta options.signal para cancelar la petición con AbortController. */
const getActivosPorLab = async (idLab, idHorario = null, options = {}) => {
  const url = idHorario
    ? `/v1/laboratorios/${idLab}/activos/?id_horario=${idHorario}`
    : `/v1/laboratorios/${idLab}/activos/`;
  const res = await api.get(url, { signal: options.signal });
  return res.data;
};

/** Historial de mantenimiento de un laboratorio */
const getHistorialLab = async (idLab) => {
  const res = await api.get(`/v1/laboratorios/${idLab}/historial/`);
  return res.data;
};

/** Cambia el estado de un equipo individual */
const actualizarEstadoActivo = async (idLab, idActivo, estado, motivo) => {
  const res = await api.patch(`/v1/laboratorios/${idLab}/activos/${idActivo}/estado/`, {
    estado,
    motivo,
  });
  return res.data;
};

const laboratorioService = {
  getLaboratorios,
  getActivosPorLab,
  getHistorialLab,
  actualizarEstadoActivo,
};

export default laboratorioService;
