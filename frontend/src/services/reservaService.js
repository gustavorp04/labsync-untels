import api from "./api";

/** PBI-03: Docente crea reserva de aula completa */
const crearReserva = async (reservaData) => {
  const res = await api.post(`/reservas/crear/`, reservaData);
  return res.data;
};

/** PBI-04: Estudiante reserva una máquina específica */
const crearReservaEstudiante = async (data) => {
  const res = await api.post(`/reservas/crear-estudiante/`, data);
  return res.data;
};

/** Mis reservas filtradas por usuario */
const getMisReservas = async (userId) => {
  const res = await api.get(`/reservas/mis-reservas/?user_id=${userId}`);
  return res.data;
};

/** Todas las reservas (admin) */
const getTodasLasReservas = async () => {
  const res = await api.get(`/v1/reservas/`);
  return res.data;
};

/** Cancelar reserva */
const cancelarReserva = async (idReserva, userId) => {
  const res = await api.patch(`/reservas/${idReserva}/cancelar/`, { user_id: userId });
  return res.data;
};

/** Marcar asistencia (admin) */
const marcarAsistencia = async (idReserva, asistio) => {
  const res = await api.post(`/reservas/${idReserva}/asistencia/`, { asistio });
  return res.data;
};

/** Eliminar reserva (admin) */
const eliminarReserva = async (id) => {
  const res = await api.delete(`/v1/reservas/${id}/`);
  return res.data;
};

/** Horarios disponibles por laboratorio (con anticipación mínima de 1 día) */
const getHorariosPorLab = async (idLab) => {
  const res = await api.get(`/laboratorios/${idLab}/horarios/`);
  return res.data;
};

const reservaService = {
  crearReserva,
  crearReservaEstudiante,
  getMisReservas,
  getTodasLasReservas,
  cancelarReserva,
  marcarAsistencia,
  eliminarReserva,
  getHorariosPorLab,
};

export default reservaService;
