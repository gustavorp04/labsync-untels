import axios from "axios";

const API_URL = `${process.env.REACT_APP_API_URL}/api/`;

export const loginUser = async (usuario, password, rol) => {
  const response = await axios.post(`${API_URL}/login/`, {
    usuario,
    password,
    rol
  });
  return response.data;
};

export const forgotPassword = async (email) => {
  const response = await axios.post(`${API_URL}/forgot-password/`, { email });
  return response.data;
};

export const resetPassword = async (token, password) => {
  const response = await axios.post(`${API_URL}/reset-password/`, { token, password });
  return response.data;
};

export const verifyToken = async (token) => {
  const response = await axios.post(`${API_URL}/verify-token/`, { token });
  return response.data;
};

const authService = {
  loginUser,
  forgotPassword,
  resetPassword,
  verifyToken
};

export default authService;
