import axios from "axios";

const API_URL = "http://localhost:8000/api/v1";

export const getUsuarios = async () => {
  const response = await axios.get(`${API_URL}/usuarios/`);
  return response.data;
};

export const crearUsuario = async (userData) => {
  const response = await axios.post(`${API_URL}/usuarios/`, userData);
  return response.data;
};

export const eliminarUsuario = async (id) => {
  const response = await axios.delete(`${API_URL}/usuarios/${id}/`);
  return response.data;
};

const userService = {
  getUsuarios,
  crearUsuario,
  eliminarUsuario
};

export default userService;
