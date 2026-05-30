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

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token && !config.url?.includes('/api/auth/')) {
      config.headers['Authorization'] = `Token ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url || '';
    const esRutaAuth = url.includes('/api/auth/');

    if ((status === 401 || status === 403) && !esRutaAuth) {
      const theme = localStorage.getItem('app-theme');
      localStorage.clear();
      if (theme) localStorage.setItem('app-theme', theme);
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export default api;
