import { signal, computed } from '@preact/signals';
import { authApi } from '@/services/ApiService';

export interface User {
  id: string;
  email: string;
  username: string;
  role: 'Admin' | 'Normal' | 'Guest';
}

const user = signal<User | null>(null);
const token = signal<string | null>(localStorage.getItem('token'));
const loading = signal<boolean>(false);

const isAuthenticated = computed(() => !!token.value);

export function useAuth() {
  const login = async (credentials: any) => {
    loading.value = true;
    try {
      const response = await authApi.login(credentials);
      const { token: newToken, user: newUser } = response.data;
      token.value = newToken;
      user.value = newUser;
      localStorage.setItem('token', newToken);
      return true;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    } finally {
      loading.value = false;
    }
  };

  const register = async (userData: any) => {
    loading.value = true;
    try {
      const response = await authApi.register(userData);
      const { token: newToken, user: newUser } = response.data;
      token.value = newToken;
      user.value = newUser;
      localStorage.setItem('token', newToken);
      return true;
    } catch (error) {
      console.error('Registration failed:', error);
      return false;
    } finally {
      loading.value = false;
    }
  };

  const logout = () => {
    token.value = null;
    user.value = null;
    localStorage.removeItem('token');
  };

  const checkMe = async () => {
    if (!token.value) return;
    loading.value = true;
    try {
      const response = await authApi.getMe();
      user.value = response.data;
    } catch (error) {
      console.error('Failed to fetch user:', error);
      logout();
    } finally {
      loading.value = false;
    }
  };

  return {
    user,
    token,
    loading,
    isAuthenticated,
    login,
    register,
    logout,
    checkMe,
  };
}

