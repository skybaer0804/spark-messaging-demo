import axios from 'axios';
import { currentWorkspaceId } from '@/stores/chatRoomsStore';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add JWT token and Workspace ID
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // v2.2.0: 현재 워크스페이스 ID가 있으면 헤더에 포함 (인증/워크스페이스 목록 조회 제외)
    const isAuthRequest = config.url?.includes('/auth/login') || config.url?.includes('/auth/register');
    const isWorkspaceListRequest = config.url === '/workspace' && config.method === 'get';

    if (currentWorkspaceId.value && !isAuthRequest && !isWorkspaceListRequest) {
      config.headers['x-workspace-id'] = currentWorkspaceId.value;
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
        window.dispatchEvent(new CustomEvent('api-error', { detail: '세션이 만료되었습니다. 다시 로그인해주세요.' }));
      }
    } else {
      // 일반적인 에러 토스트 표시 (단, auth 관련 API는 호출부에서 직접 에러 처리를 할 수 있도록 조건부 표시)
      if (error.config && !error.config.url.includes('/auth/login') && !error.config.url.includes('/auth/register')) {
        window.dispatchEvent(new CustomEvent('api-error', { detail: message }));
      }
    }

    return Promise.reject(error);
  },
);

export const authApi = {
  register: (data: any) => api.post('/auth/register', data),
  login: (data: any) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
  getUsers: (workspaceId?: string) => api.get('/auth/users', { params: { workspaceId } }),
  updateProfile: (data: {
    username?: string;
    profileImage?: string;
    status?: string;
    statusText?: string;
    role?: string;
  }) => api.put('/auth/profile', data),
  updateNotificationSettings: (data: { globalEnabled?: boolean; roomPreferences?: Record<string, boolean> }) =>
    api.post('/auth/notification-settings', data),
};

export const chatApi = {
  getRooms: (workspaceId?: string) => api.get('/chat/rooms', { params: { workspaceId } }),
  createRoom: (data: {
    name?: string;
    members?: string[];
    description?: string;
    workspaceId?: string;
    type?: string;
    teamId?: string;
    parentId?: string;
    isPrivate?: boolean;
  }) => api.post('/chat/rooms', data),
  leaveRoom: (roomId: string) => api.post(`/chat/leave/${roomId}`),
  getMessages: (roomId: string) => api.get(`/chat/messages/${roomId}`),
  sendMessage: (data: { roomId: string; content: string; type?: string; tempId?: string }) =>
    api.post('/chat/messages', data),
  syncMessages: (roomId: string, fromSequence: number) => api.get(`/chat/sync/${roomId}?fromSequence=${fromSequence}`),
  markAsRead: (roomId: string) => api.post(`/chat/read/${roomId}`),
  uploadFile: (formData: FormData) =>
    api.post('/chat/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }),
  setActiveRoom: (roomId: string | null) => api.post('/chat/active-room', { roomId }),
};

export const workspaceApi = {
  getWorkspaces: () => api.get('/workspace'),
  getWorkspace: (workspaceId: string) => api.get(`/workspace/${workspaceId}`),
  getPrivateKey: (workspaceId: string) => api.get(`/workspace/${workspaceId}/private-key`),
  createWorkspace: (data: {
    name: string;
    initials?: string;
    color?: string;
    projectUrl?: string;
    allowPublicJoin?: boolean;
  }) => api.post('/workspace', data),
  joinWorkspace: (workspaceId: string) => api.post(`/workspace/${workspaceId}/join`),
  updateWorkspace: (
    workspaceId: string,
    data: { name?: string; initials?: string; color?: string; allowPublicJoin?: boolean },
  ) => api.patch(`/workspace/${workspaceId}`, data),
  createCompany: (data: { name: string; workspaceId: string }) => api.post('/workspace/company', data),
  createDept: (data: { name: string; companyId: string; workspaceId: string; parentId?: string }) =>
    api.post('/workspace/dept', data),
  getWorkspaceStructure: (workspaceId: string) => api.get(`/workspace/${workspaceId}/structure`),
};

export const notificationApi = {
  getNotifications: () => api.get('/notification'),
  syncNotifications: () => api.get('/notification/sync'),
  createNotification: (data: {
    title: string;
    content: string;
    scheduledAt?: string;
    targetType?: 'all' | 'workspace';
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
    invitedWorkspaces?: string[];
    isReserved?: boolean;
    isPrivate?: boolean;
    password?: string;
  }) => api.post('/video-meeting', data),
  startMeeting: (meetingId: string) => api.post(`/video-meeting/${meetingId}/start`),
  deleteMeeting: (meetingId: string) => api.delete(`/video-meeting/${meetingId}`),
  getMeetingByHash: (hash: string) => api.get(`/video-meeting/join/${hash}`),
  verifyMeetingPassword: (hash: string, password?: string) =>
    api.post(`/video-meeting/join/${hash}/verify`, { password }),
};

export const pushApi = {
  subscribe: (data: { subscription: any; deviceId: string }) => api.post('/push/subscribe', data),
  unsubscribe: (deviceId: string | null) => api.post('/push/unsubscribe', { deviceId }),
  checkStatus: (deviceId: string) => api.get('/push/status', { params: { deviceId } }),
};

export default api;
