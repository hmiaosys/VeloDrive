import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  tenantId: string;
  email: string;
  fullName: string;
  role: string;
}

interface AuthState {
  token: string | null;
  refreshToken: string | null;
  user: User | null;
  setAuth: (token: string, refreshToken: string, user: User) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      refreshToken: null,
      user: null,
      setAuth: (token, refreshToken, user) => {
        localStorage.setItem('accessToken', token);
        localStorage.setItem('refreshToken', refreshToken);
        set({ token, refreshToken, user });
      },
      clearAuth: () => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        set({ token: null, refreshToken: null, user: null });
      },
    }),
    { name: 'auth-storage' }
  )
);
