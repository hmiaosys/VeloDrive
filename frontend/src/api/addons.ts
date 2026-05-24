import apiClient from './client';

export interface AddOnResponse {
  id: string;
  name: string;
  description: string | null;
  unitType: string;
  basePrice: number;
  isPerItem: boolean;
  quantity: number;
  customFields: string | null;
  isActive: boolean;
}

export interface AddOnRequest {
  name: string;
  description?: string;
  unitType: string;
  basePrice: number;
  isPerItem: boolean;
  quantity?: number;
  customFields?: string | null;
}

export const addonsApi = {
  getAll: () => apiClient.get<AddOnResponse[]>('/addons').then(r => r.data),
  create: (data: AddOnRequest) => apiClient.post<AddOnResponse>('/addons', data).then(r => r.data),
  update: (id: string, data: AddOnRequest) => apiClient.put<AddOnResponse>(`/addons/${id}`, data).then(r => r.data),
  delete: (id: string) => apiClient.delete(`/addons/${id}`).then(r => r.data),
};
