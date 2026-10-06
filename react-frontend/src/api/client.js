import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: attach token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('kameti_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: handle 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const isLoginRequest = error.config?.url?.includes('/auth/login');
      // If unauthorized on protected routes and not already on login page
      if (!isLoginRequest && !window.location.pathname.includes('/login')) {
        localStorage.removeItem('kameti_token');
        localStorage.removeItem('kameti_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
