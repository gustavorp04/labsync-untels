import axios from "axios";

const API_URL = "http://localhost:8000/api";

export const crearReserva = async (reservaData) => {
  /*
    reservaData debe contener:
    - user_id (temporalmente)
    - id_horario
    - cantidad_alumnos
    - acepto_declaracion_jurada
  */
  const response = await axios.post(`${API_URL}/reservas/crear/`, reservaData);
  return response.data;
};

export const getTodasLasReservas = async () => {
  const response = await axios.get(`${API_URL}/v1/reservas/`);
  return response.data;
};

export const eliminarReserva = async (id) => {
  const response = await axios.delete(`${API_URL}/v1/reservas/${id}/`);
  return response.data;
};

const reservaService = {
  crearReserva,
  getTodasLasReservas,
  eliminarReserva
};

export default reservaService;
