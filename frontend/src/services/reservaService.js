import axios from "axios";

const API_URL = `${process.env.REACT_APP_API_URL}/api`;

/** PBI-03: Docente crea reserva de aula completa */
const crearReserva = async (reservaData) => {
  const res = await axios.post(`${API_URL}/reservas/crear/`, reservaData);
  return res.data;
};

/** PBI-04: Estudiante reserva una máquina específica */
const crearReservaEstudiante = async (data) => {
  const res = await axios.post(`${API_URL}/reservas/crear-estudiante/`, data);
  return res.data;
};

/** Mis reservas filtradas por usuario */
const getMisReservas = async (userId) => {
  const res = await axios.get(`${API_URL}/reservas/mis-reservas/?user_id=${userId}`);
  return res.data;
};

/** Todas las reservas (admin) */
const getTodasLasReservas = async () => {
  const res = await axios.get(`${API_URL}/v1/reservas/`);
  return res.data;
};

/** Cancelar reserva */
const cancelarReserva = async (idReserva, userId) => {
  const res = await axios.patch(`${API_URL}/reservas/${idReserva}/cancelar/`, { user_id: userId });
  return res.data;
};

/** Eliminar reserva (admin) */
const eliminarReserva = async (id) => {
  const res = await axios.delete(`${API_URL}/v1/reservas/${id}/`);
  return res.data;
};

/** Horarios disponibles por laboratorio (con anticipación mínima de 1 día) */
const getHorariosPorLab = async (idLab) => {
  const res = await axios.get(`${API_URL}/laboratorios/${idLab}/horarios/`);
  return res.data;
};

const reservaService = {
  crearReserva,
  crearReservaEstudiante,
  getMisReservas,
  getTodasLasReservas,
  cancelarReserva,
  eliminarReserva,
  getHorariosPorLab,
};

export default reservaService;
