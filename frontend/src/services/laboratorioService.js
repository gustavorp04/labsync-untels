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

/** Cambia el estado de un equipo individual. Si se pasa imagen, usa FormData. */
const actualizarEstadoActivo = async (idLab, idActivo, estado, motivo, imagen = null) => {
  if (imagen) {
    const form = new FormData();
    form.append('estado', estado);
    form.append('motivo', motivo);
    form.append('imagen', imagen);
    const res = await api.patch(`/v1/laboratorios/${idLab}/activos/${idActivo}/estado/`, form);
    return res.data;
  }
  const res = await api.patch(`/v1/laboratorios/${idLab}/activos/${idActivo}/estado/`, { estado, motivo });
  return res.data;
};

/** PBI-22: Registra una incidencia para un equipo activo. Si se pasa imagen, usa FormData. */
const registrarIncidencia = async (idLab, idActivo, descripcion_dano, estado_activo_post, imagen = null) => {
  if (imagen) {
    const form = new FormData();
    form.append('descripcion_dano', descripcion_dano);
    form.append('estado_activo_post', estado_activo_post);
    form.append('imagen', imagen);
    const res = await api.post(`/v1/laboratorios/${idLab}/activos/${idActivo}/incidencia/`, form);
    return res.data;
  }
  const res = await api.post(`/v1/laboratorios/${idLab}/activos/${idActivo}/incidencia/`, {
    descripcion_dano,
    estado_activo_post,
  });
  return res.data;
};

/** PBI-12: Inhabilita un laboratorio manualmente con un motivo. Si se pasa imagen, usa FormData. */
const inhabilitarLaboratorio = async (idLab, motivo, usuarioId, imagen = null) => {
  if (imagen) {
    const form = new FormData();
    form.append('motivo', motivo);
    form.append('usuario_id', usuarioId ?? '');
    form.append('imagen', imagen);
    const res = await api.post(`/v1/laboratorios/${idLab}/inhabilitar/`, form);
    return res.data;
  }
  const res = await api.post(`/v1/laboratorios/${idLab}/inhabilitar/`, {
    motivo,
    usuario_id: usuarioId,
  });
  return res.data;
};

const habilitarLaboratorio = async (idLab) => {
  const res = await api.post(`/v1/laboratorios/${idLab}/habilitar/`);
  return res.data;
};

const laboratorioService = {
  getLaboratorios,
  getActivosPorLab,
  getHistorialLab,
  actualizarEstadoActivo,
  registrarIncidencia,
  inhabilitarLaboratorio,
  habilitarLaboratorio,
};

export default laboratorioService;
