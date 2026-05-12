import api from "./api";

export const loginUser = async (usuario, password, rol) => {
  // Use the specific endpoint based on the role requested
  const endpoint = `/auth/${rol}/login/`;
  const response = await api.post(endpoint, {
    usuario,
    password
  });
  return response.data;
};

export const forgotPassword = async (email) => {
  const response = await api.post(`/forgot-password/`, { email });
  return response.data;
};

export const resetPassword = async (token, password) => {
  const response = await api.post(`/reset-password/`, { token, password });
  return response.data;
};

export const verifyToken = async (token) => {
  const response = await api.post(`/verify-token/`, { token });
  return response.data;
};

const authService = {
  loginUser,
  forgotPassword,
  resetPassword,
  verifyToken
};

export default authService;
