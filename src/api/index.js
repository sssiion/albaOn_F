import axios from 'axios';
import { getToken } from '../lib/auth';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000'
});

// 요청마다 토큰 자동 첨부
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// 401 시 로그인 페이지로
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('albaon_token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;