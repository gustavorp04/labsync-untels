import axios from 'axios';

// Detectar la URL de la API. 
// En producción (Render), se usará REACT_APP_API_URL.
// Si no está definida, usamos http://localhost:8000 en desarrollo local como fallback.
const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: `${baseURL}/api`,
  withCredentials: true,   // C-2: envía la cookie httpOnly auth_token en cada request
  headers: {
    'Content-Type': 'application/json',
    // S-1 (CWE-352): cabecera no-simple que obliga al navegador a hacer preflight
    // CORS en cada petición que muta estado; el backend la exige para la auth por
    // cookie, de modo que un sitio cross-site no autorizado no puede ejecutar la
    // petición real (protección CSRF).
    'X-Requested-With': 'XMLHttpRequest',
  },
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url || '';
    const esRutaAuth = url.includes('/api/auth/');

    const esErrorNegocio = status === 403 && error.response?.data?.codigo;
    if ((status === 401 || status === 403) && !esRutaAuth && !esErrorNegocio) {
      const theme = localStorage.getItem('app-theme');
      localStorage.clear();
      if (theme) localStorage.setItem('app-theme', theme);
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export default api;
