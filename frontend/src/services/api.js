import axios from 'axios';

// Detectar la URL de la API. 
// En producción (Render), se usará REACT_APP_API_URL.
// Si no está definida, intentamos usar el origen actual como fallback si el backend está en el mismo dominio,
// pero lo ideal es configurarla en el dashboard de Render.
const baseURL = process.env.REACT_APP_API_URL || '';

const api = axios.create({
  baseURL: `${baseURL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para debugging (opcional)
api.interceptors.request.use((config) => {
  if (!baseURL && process.env.NODE_ENV === 'production') {
    console.warn('REACT_APP_API_URL no está definida. Las peticiones podrían fallar.');
  }
  return config;
});

export default api;
