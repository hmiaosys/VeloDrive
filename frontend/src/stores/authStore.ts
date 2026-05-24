import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  tenantId: string;
  email: string;
  firstName: string;
  lastName: string;
  position: string;
  permissions: string[];
  account: string;
}

interface AuthState {
  token: string | null;
  refreshToken: string | null;
  user: User | null;
  hasPermission: (permission: string) => boolean;
  setAuth: (token: string, refreshToken: string, user: User) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      refreshToken: null,
      user: null,
      hasPermission: (permission: string) => get().user?.permissions?.includes(permission) ?? false,
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
