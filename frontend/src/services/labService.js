import axios from "axios";

const API_URL = "http://localhost:8000/api";

export const getLaboratorios = async () => {
  const response = await axios.get(`${API_URL}/laboratorios/`);
  return response.data;
};

export const getLaboratorioDetalle = async (idLaboratorio) => {
  const response = await axios.get(`${API_URL}/laboratorios/${idLaboratorio}/activos/`);
  return response.data;
};

export const updateActivoEstado = async (idActivo, estado) => {
  // PBI-02: Al llamar a esto, el backend re-evaluará si el laboratorio sigue habilitado.
  const response = await axios.put(`${API_URL}/activos/${idActivo}/`, { estado });
  return response.data;
};

export const getHorariosDisponibles = async () => {
  const response = await axios.get(`${API_URL}/v1/horarios/`); 
  return response.data;
};

const labService = {
  getLaboratorios,
  getLaboratorioDetalle,
  updateActivoEstado,
  getHorariosDisponibles
};

export default labService;
