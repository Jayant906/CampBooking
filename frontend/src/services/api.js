import axios from 'axios';

const getApiBaseUrl = () => {
  const backendUrl = import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_API_URL || '/api';
  if (!backendUrl || backendUrl === '/api') {
    return '/api';
  }
  const cleaned = backendUrl.replace(/\/+$/, '');
  return cleaned.endsWith('/api') ? cleaned : `${cleaned}/api`;
};

const API_BASE_URL = getApiBaseUrl();

// Only force logout when the token itself is unusable.
// Feature-specific 401 responses should be handled by the page that made the request.
const shouldForceLogout = (error) => {
  const requestUrl = String(error.config?.url || '').toLowerCase();
  const message = String(error.response?.data?.message || '').toLowerCase();

  if (requestUrl.includes('/auth/me')) {
    return true;
  }

  return message.includes('token') && (
    message.includes('expired') ||
    message.includes('invalid') ||
    message.includes('signature') ||
    message.includes('issuer') ||
    message.includes('audience')
  );
};

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && shouldForceLogout(error)) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
