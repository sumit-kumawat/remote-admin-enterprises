import { create } from 'zustand';
import type { UserDto } from '../types/api';

const TOKEN_KEY = 'ra_token';

interface AuthState {
  token: string | null;
  user: UserDto | null;
  isAuthenticated: boolean;
  setAuth: (token: string, user: UserDto) => void;
  setUser: (user: UserDto) => void;
  clearAuth: () => void;
}

const getInitialToken = (): string | null => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};

export const useAuthStore = create<AuthState>((set) => ({
  token: getInitialToken(),
  user: null,
  isAuthenticated: Boolean(getInitialToken()),

  setAuth: (token: string, user: UserDto) => {
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch (e) {
      console.error('Failed to store token in localStorage:', e);
    }
    set({
      token,
      user,
      isAuthenticated: true,
    });
  },

  setUser: (user: UserDto) => {
    set({ user });
  },

  clearAuth: () => {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch (e) {
      console.error('Failed to remove token from localStorage:', e);
    }
    set({
      token: null,
      user: null,
      isAuthenticated: false,
    });
  },
}));
