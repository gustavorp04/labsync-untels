import api from "./api";

export const getUsuarios = async () => {
  const response = await api.get(`/v1/usuarios/`);
  return response.data;
};

export const crearUsuario = async (userData) => {
  const response = await api.post(`/v1/usuarios/`, userData);
  return response.data;
};

export const eliminarUsuario = async (id) => {
  const response = await api.delete(`/v1/usuarios/${id}/`);
  return response.data;
};

const userService = {
  getUsuarios,
  crearUsuario,
  eliminarUsuario
};

export default userService;
