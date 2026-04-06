import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authApi } from '../services/api';

interface User {
  id: string;
  userCode?: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'STAFF' | 'CLIENT';
  phone?: string;
  customerId?: string;
  customer?: {
    id: string;
    customerCode?: string;
    name: string;
    phone?: string;
    address?: string;
  };
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  /** True while restoring session from storage (root layout waits on this). */
  isHydrating: boolean;
  /** True only during sign-in request — separate so Sign In stays tappable during hydrate. */
  isLoggingIn: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loadUser: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isHydrating: false,
  isLoggingIn: false,
  error: null,

  login: async (email, password) => {
    set({ isLoggingIn: true, error: null });
    try {
      const { data } = await authApi.login(email, password);
      const { accessToken, refreshToken, user } = data.data;
      await AsyncStorage.multiSet([
        ['accessToken', accessToken],
        ['refreshToken', refreshToken],
        ['user', JSON.stringify(user)],
      ]);
      set({ user, isAuthenticated: true, isLoggingIn: false });
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || 'Login failed';
      console.error('LOGIN ERROR DETAILS:', err);
      set({ error: message, isLoggingIn: false });
      throw new Error(message);
    }
  },

  logout: async () => {
    try {
      const refreshToken = await AsyncStorage.getItem('refreshToken');
      if (refreshToken) await authApi.logout(refreshToken);
    } catch { }
    await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user']);
    set({ user: null, isAuthenticated: false });
  },

  loadUser: async () => {
    set({ isHydrating: true });
    try {
      const token = await AsyncStorage.getItem('accessToken');
      const userStr = await AsyncStorage.getItem('user');
      if (!token || !userStr) {
        set({ isHydrating: false });
        return;
      }
      const user = JSON.parse(userStr);
      set({ user, isAuthenticated: true, isHydrating: false });
    } catch {
      set({ isHydrating: false });
    }
  },

  clearError: () => set({ error: null }),
}));
