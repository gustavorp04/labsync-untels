import api from "./api";

/** PBI-03: Docente crea reserva de aula completa */
const crearReserva = async (reservaData) => {
  const userId = reservaData.user_id;
  const res = await api.post(`/v1/usuarios/${userId}/reservas/`, reservaData);
  return res.data;
};

/** PBI-04: Estudiante reserva una máquina específica */
const crearReservaEstudiante = async (data) => {
  const userId = data.user_id;
  const res = await api.post(`/v1/usuarios/${userId}/reservas/`, data);
  return res.data;
};

/** Mis reservas filtradas por usuario usando la ruta anidada RESTful */
const getMisReservas = async (userId) => {
  const res = await api.get(`/v1/usuarios/${userId}/reservas/`);
  return res.data;
};

/** Todas las reservas (admin) */
const getTodasLasReservas = async () => {
  const res = await api.get(`/v1/reservas/`);
  return res.data;
};

/** Obtener detalle de una reserva individual (admin) */
const getReservaById = async (id) => {
  const res = await api.get(`/v1/reservas/${id}/`);
  return res.data;
};

/** Cancelar reserva usando la ruta anidada RESTful */
const cancelarReserva = async (idReserva, userId) => {
  const res = await api.patch(`/v1/usuarios/${userId}/reservas/${idReserva}/cancelar/`);
  return res.data;
};

/** Marcar asistencia (admin) */
const marcarAsistencia = async (idReserva, asistio) => {
  const res = await api.post(`/v1/reservas/${idReserva}/asistencia/`, { asistio });
  return res.data;
};

/** Eliminar reserva (admin) */
const eliminarReserva = async (id) => {
  const res = await api.delete(`/v1/reservas/${id}/`);
  return res.data;
};

/** Horarios disponibles por laboratorio (con anticipación mínima de 1 día) */
const getHorariosPorLab = async (idLab) => {
  const res = await api.get(`/v1/laboratorios/${idLab}/horarios/`);
  return res.data;
};

/** Historial global de cambios de estado de reservas */
const getHistorialReservas = async () => {
  const res = await api.get(`/v1/reservas/historial/`);
  return res.data;
};

/** Todos los horarios por lab y fecha (con cualquier estado para el admin) */
const getTodosLosHorariosPorLabYFecha = async (idLab, fecha) => {
  const res = await api.get(`/v1/laboratorios/${idLab}/horarios/?fecha=${fecha}`);
  return res.data;
};

const reservaService = {
  crearReserva,
  crearReservaEstudiante,
  getMisReservas,
  getTodasLasReservas,
  getReservaById,
  cancelarReserva,
  marcarAsistencia,
  eliminarReserva,
  getHorariosPorLab,
  getHistorialReservas,
  getTodosLosHorariosPorLabYFecha,
};

export default reservaService;
