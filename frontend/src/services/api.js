import axios from 'axios';
import useAuthStore from '../store/authStore';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

const api = axios.create({
  baseURL: API_URL,
});

// Request interceptor: attach token if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: handle 401 and normalize validation errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // ✅ Convert FastAPI validation error detail from array to string
    const detail = error.response?.data?.detail;
    if (Array.isArray(detail)) {
      error.response.data.detail = detail
        .map((d) => d.msg || JSON.stringify(d))
        .join(', ');
    }

    // Handle 401 globally
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export default api;