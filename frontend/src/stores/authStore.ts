import { create } from 'zustand';
import type { User } from '@/types';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  viewAsRole: string | null;
  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  clearAuth: () => void;
  setUser: (user: User) => void;
  setViewAsRole: (role: string | null) => void;
  effectiveRole: () => string | null;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: localStorage.getItem('accessToken'),
  isAuthenticated: !!localStorage.getItem('accessToken'),
  viewAsRole: localStorage.getItem('devModeRole'),

  setAuth: (user, accessToken, refreshToken) => {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    set({ user, accessToken, isAuthenticated: true });
  },

  clearAuth: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('devModeRole');
    set({ user: null, accessToken: null, isAuthenticated: false, viewAsRole: null });
  },

  setUser: (user) => set({ user }),

  setViewAsRole: (role) => {
    if (role) {
      localStorage.setItem('devModeRole', role);
    } else {
      localStorage.removeItem('devModeRole');
    }
    set({ viewAsRole: role });
  },

  effectiveRole: () => {
    const state = get();
    return state.viewAsRole || state.user?.role || null;
  },
}));
