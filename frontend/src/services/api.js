import axios from 'axios';

// Detectar la URL de la API. 
// En producción (Render), se usará REACT_APP_API_URL.
// Si no está definida, usamos http://localhost:8000 en desarrollo local como fallback.
const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: `${baseURL}/api`,
  // C-2: withCredentials envía la cookie httpOnly auth_token en cada petición
  // (cross-origin requiere CORS_ALLOW_CREDENTIALS=True en el backend)
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// C-2: El token ya no se lee de localStorage — viaja en la cookie httpOnly.
// Mantenemos el interceptor para advertencias de configuración en producción.
api.interceptors.request.use(
  (config) => {
    if (!process.env.REACT_APP_API_URL && process.env.NODE_ENV === 'production') {
      console.warn('REACT_APP_API_URL no está definida. Las peticiones podrían fallar.');
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor para manejar respuestas con código de error 401 (Token vencido o inválido)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    if (status === 401 || (status === 403 && !localStorage.getItem('id_usuario'))) {
      // Limpiar datos de sesión local (el backend ya expiró la cookie o falta)
      const theme = localStorage.getItem('app-theme');
      localStorage.clear();
      if (theme) localStorage.setItem('app-theme', theme);
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export default api;
