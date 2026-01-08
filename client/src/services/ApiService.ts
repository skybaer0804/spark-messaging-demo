import axios from 'axios';
import { toast } from 'react-toastify';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message || '서버와의 통신 중 오류가 발생했습니다.';
    
    // 401 Unauthorized 처리 (토큰 만료 등)
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      // 이미 로그인 페이지가 아니라면 알림 표시
      if (!window.location.pathname.includes('/auth')) {
        toast.error('세션이 만료되었습니다. 다시 로그인해주세요.');
      }
    } else {
      // 일반적인 에러 토스트 표시 (단, auth 관련 API는 호출부에서 직접 에러 처리를 할 수 있도록 조건부 표시)
      if (!error.config.url.includes('/auth/login') && !error.config.url.includes('/auth/register')) {
        toast.error(message);
      }
    }
    
    return Promise.reject(error);
  }
);

export const authApi = {
  register: (data: any) => api.post('/auth/register', data),
  login: (data: any) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
};

export const chatApi = {
  getRooms: () => api.get('/chat/rooms'),
  createRoom: (data: any) => api.post('/chat/rooms', data),
  getMessages: (roomId: string) => api.get(`/chat/messages/${roomId}`),
  sendMessage: (data: any) => api.post('/chat/messages', data),
  uploadFile: (formData: FormData) => api.post('/chat/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }),
};

export const pushApi = {
  subscribe: (subscription: any) => api.post('/push/subscribe', subscription),
  unsubscribe: () => api.post('/push/unsubscribe'),
};

export default api;

