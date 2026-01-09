import axios from 'axios';
import { useToast } from '@/context/ToastContext';
const { showError } = useToast();
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
  (error) => Promise.reject(error),
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
        showError('세션이 만료되었습니다. 다시 로그인해주세요.');
      }
    } else {
      // 일반적인 에러 토스트 표시 (단, auth 관련 API는 호출부에서 직접 에러 처리를 할 수 있도록 조건부 표시)
      if (!error.config.url.includes('/auth/login') && !error.config.url.includes('/auth/register')) {
        showError(message);
      }
    }

    return Promise.reject(error);
  },
);

export const authApi = {
  register: (data: any) => api.post('/auth/register', data),
  login: (data: any) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  getUsers: () => api.get('/auth/users'),
  updateNotificationSettings: (data: { globalEnabled?: boolean; roomPreferences?: Record<string, boolean> }) =>
    api.post('/auth/notification-settings', data),
};

export const chatApi = {
  getRooms: () => api.get('/chat/rooms'),
  createRoom: (data: { name: string; members?: string[]; invitedOrgs?: string[]; isGroup?: boolean }) =>
    api.post('/chat/rooms', data),
  getMessages: (roomId: string) => api.get(`/chat/messages/${roomId}`),
  sendMessage: (data: any) => api.post('/chat/messages', data),
  uploadFile: (formData: FormData) =>
    api.post('/chat/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }),
  setActiveRoom: (roomId: string | null) => api.post('/chat/active-room', { roomId }),
};

export const orgApi = {
  getOrganizations: () => api.get('/org'),
  createOrganization: (data: { name: string; dept1: string; dept2?: string }) => api.post('/org', data),
};

export const notificationApi = {
  getNotifications: () => api.get('/notification'),
  createNotification: (data: {
    title: string;
    content: string;
    scheduledAt?: string;
    targetType?: 'all' | 'organization';
    targetId?: string;
  }) => api.post('/notification', data),
};

export const videoMeetingApi = {
  getMeetings: () => api.get('/video-meeting'),
  createMeeting: (data: {
    title: string;
    description?: string;
    scheduledAt: string;
    invitedUsers?: string[];
    invitedOrgs?: string[];
  }) => api.post('/video-meeting', data),
  startMeeting: (meetingId: string) => api.post(`/video-meeting/${meetingId}/start`),
};

export const pushApi = {
  subscribe: (data: { subscription: any; deviceId: string }) => api.post('/push/subscribe', data),
  unsubscribe: (deviceId: string | null) => api.post('/push/unsubscribe', { deviceId }),
};

export default api;
