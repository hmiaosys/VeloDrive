import apiClient from './client';

interface LoginRequest {
  email: string;
  password: string;
}

interface RegisterRequest {
  tenantName: string;
  subdomain: string;
  fullName: string;
  email: string;
  password: string;
}

interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  user: {
    id: string;
    tenantId: string;
    email: string;
    fullName: string;
    role: string;
  };
}

export const authApi = {
  login: (data: LoginRequest) =>
    apiClient.post<AuthResponse>('/auth/login', data).then(r => r.data),

  register: (data: RegisterRequest) =>
    apiClient.post<AuthResponse>('/auth/register', data).then(r => r.data),

  refresh: (refreshToken: string) =>
    apiClient.post<AuthResponse>('/auth/refresh', { refreshToken }).then(r => r.data),

  me: () =>
    apiClient.get<AuthResponse['user']>('/auth/me').then(r => r.data),
};
