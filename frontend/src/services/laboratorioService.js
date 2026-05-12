import api from "./api";

/** Lista todos los laboratorios con estado calculado */
const getLaboratorios = async () => {
  const res = await api.get(`/laboratorios/`);
  return res.data;
};

/** Lista los activos (PCs/Mesas) de un laboratorio. 
 * Si se envía idHorario, el backend marca cuáles están reservados. */
const getActivosPorLab = async (idLab, idHorario = null) => {
  const url = idHorario 
    ? `/laboratorios/${idLab}/activos/?id_horario=${idHorario}`
    : `/laboratorios/${idLab}/activos/`;
  const res = await api.get(url);
  return res.data;
};

/** Historial de mantenimiento de un laboratorio */
const getHistorialLab = async (idLab) => {
  const res = await api.get(`/laboratorios/${idLab}/historial/`);
  return res.data;
};

/** Cambia el estado de un equipo individual */
const actualizarEstadoActivo = async (idActivo, estado, motivo, registradoPor) => {
  const res = await api.patch(`/activos/${idActivo}/estado/`, {
    estado,
    motivo,
    registrado_por: registradoPor,
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
