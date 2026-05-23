import apiClient from './client';

export interface AddOnResponse {
  id: string;
  name: string;
  description: string | null;
  unitType: string;
  basePrice: number;
  isPerItem: boolean;
  isActive: boolean;
}

export const addonsApi = {
  getAll: () => apiClient.get<AddOnResponse[]>('/addons').then(r => r.data),
};
