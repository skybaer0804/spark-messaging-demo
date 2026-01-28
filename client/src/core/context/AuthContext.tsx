import { createContext } from 'preact';
import { useContext, useState, useEffect } from 'preact/hooks';
import { authApi } from '@/core/api/ApiService';
import sparkMessagingClient from '@/config/sparkMessaging';
import { useToast } from './ToastContext';
import { getLocalStorage, setLocalStorage, removeLocalStorage } from '@/core/utils/storageCache';

export interface User {
  id: string;
  email: string;
  username: string;
  role: 'admin' | 'user' | 'guest';
  profileImage?: string;
  status?: 'online' | 'away' | 'busy' | 'offline';
  statusText?: string;
  workspaces?: string[];
  companyId?: string;
  deptId?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (credentials: any) => Promise<any>;
  signUp: (userData: any) => Promise<any>;
  signOut: () => Promise<void>;
  updateUser: (updatedUser: User) => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: any }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { showSuccess, showError } = useToast();

  const getToken = () => getLocalStorage('token');

  useEffect(() => {
    const initAuth = async () => {
      const token = getToken();
      if (token) {
        try {
          const response = await authApi.getMe();
          const userData = response.data;

          // v2.2.0: 초기 로드 시 워크스페이스 정보 반영
          if (userData.workspaces && userData.workspaces.length > 0) {
            const { currentWorkspaceId } = await import('@/stores/chatRoomsStore');
            if (!currentWorkspaceId.value) {
              currentWorkspaceId.value = userData.workspaces[0];
            }
          }

          setUser(userData);
        } catch (err) {
          console.error('Failed to get user:', err);
          removeLocalStorage('token');
          setUser(null);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const signIn = async (credentials: any) => {
    try {
      const response = await authApi.login(credentials);
      const { token, user: userData } = response.data;
      setLocalStorage('token', token);

      // v2.2.0: 워크스페이스 정보가 있으면 전역 스토어에 즉시 반영
      if (userData.workspaces && userData.workspaces.length > 0) {
        const { currentWorkspaceId } = await import('@/stores/chatRoomsStore');
        if (!currentWorkspaceId.value) {
          currentWorkspaceId.value = userData.workspaces[0];
        }
      }

      setUser(userData);
      showSuccess('로그인되었습니다');
      return response.data;
    } catch (error: any) {
      showError(error.message || '로그인에 실패했습니다');
      throw error;
    }
  };

  const signUp = async (userData: any) => {
    try {
      const response = await authApi.register(userData);
      const { token, user: newUser } = response.data;
      setLocalStorage('token', token);
      setUser(newUser);
      showSuccess('회원가입이 완료되었습니다');
      return response.data;
    } catch (error: any) {
      showError(error.message || '회원가입에 실패했습니다');
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await authApi.logout();

      // v2.2.0: 로그아웃 시 소켓 클라이언트 완전히 초기화
      sparkMessagingClient.disconnect();

      // 로그아웃 시 서비스 워커 해제 (푸시 알림 등 중단)
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const registration of registrations) {
          await registration.unregister();
        }
      }
    } catch (error) {
      console.error('Logout API failed:', error);
    } finally {
      removeLocalStorage('token');
      setUser(null);
      showSuccess('로그아웃되었습니다');
    }
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
  };

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut, updateUser, isAuthenticated }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
