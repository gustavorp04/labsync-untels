import axios from 'axios';

// Detectar la URL de la API. 
// En producción (Render), se usará REACT_APP_API_URL.
// Si no está definida, usamos http://localhost:8000 en desarrollo local como fallback.
const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: `${baseURL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para inyectar el token de autenticación Bearer
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    
    if (!process.env.REACT_APP_API_URL && process.env.NODE_ENV === 'production') {
      console.warn('REACT_APP_API_URL no está definida. Las peticiones podrían fallar.');
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar respuestas con código de error 401 (Token vencido o inválido)
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      // Limpiar datos de sesión local
      const theme = localStorage.getItem('app-theme');
      localStorage.clear();
      if (theme) {
        localStorage.setItem('app-theme', theme);
      }
      localStorage.setItem('isAuthenticated', 'false');
      // Redirigir a la página de login principal
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export default api;
