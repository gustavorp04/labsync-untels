import axios from "axios";

const API_URL = `${process.env.REACT_APP_API_URL}/api`;

/** Lista todos los laboratorios con estado calculado */
const getLaboratorios = async () => {
  const res = await axios.get(`${API_URL}/laboratorios/`);
  return res.data;
};

/** Lista los activos (PCs/Mesas) de un laboratorio. 
 * Si se envía idHorario, el backend marca cuáles están reservados. */
const getActivosPorLab = async (idLab, idHorario = null) => {
  const url = idHorario 
    ? `${API_URL}/laboratorios/${idLab}/activos/?id_horario=${idHorario}`
    : `${API_URL}/laboratorios/${idLab}/activos/`;
  const res = await axios.get(url);
  return res.data;
};

/** Historial de mantenimiento de un laboratorio */
const getHistorialLab = async (idLab) => {
  const res = await axios.get(`${API_URL}/laboratorios/${idLab}/historial/`);
  return res.data;
};

/** Cambia el estado de un equipo individual */
const actualizarEstadoActivo = async (idActivo, estado, motivo, registradoPor) => {
  const res = await axios.patch(`${API_URL}/activos/${idActivo}/estado/`, {
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
