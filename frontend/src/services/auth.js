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

// C-2: Llama al endpoint que invalida la sesión en BD y expira la cookie httpOnly.
// Siempre resuelve (nunca lanza) para que el componente pueda limpiar localStorage
// incluso si el token ya estaba vencido.
export const logoutUser = async () => {
  try {
    const response = await api.post('/auth/logout/');
    return response.data;
  } catch {
    // Token ya expirado u otro error — ignorar, el componente limpia igual
    return null;
  }
};

const authService = {
  loginUser,
  forgotPassword,
  resetPassword,
  verifyToken,
  logoutUser,
};

export default authService;
