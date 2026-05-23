import apiClient from './client';

export interface ItemResponse {
  id: string;
  name: string;
  categoryId: string;
  categoryName: string;
  sku: string | null;
  description: string | null;
  unitType: string;
  basePrice: number;
  depositAmount: number;
  quantity: number;
  customFields: string | null;
  images: string[] | null;
  isActive: boolean;
  createdOnUtc: string;
}

export interface CreateItemRequest {
  name: string;
  categoryId: string;
  sku?: string;
  description?: string;
  unitType: string;
  basePrice: number;
  depositAmount: number;
  quantity?: number;
  customFields?: string;
  images?: string[];
}

export const itemsApi = {
  getAll: (params?: { categoryId?: string; search?: string }) =>
    apiClient.get<ItemResponse[]>('/items', { params }).then(r => r.data),

  getById: (id: string) =>
    apiClient.get<ItemResponse>(`/items/${id}`).then(r => r.data),

  create: (data: CreateItemRequest) =>
    apiClient.post<ItemResponse>('/items', data).then(r => r.data),

  update: (id: string, data: CreateItemRequest) =>
    apiClient.put<ItemResponse>(`/items/${id}`, data).then(r => r.data),

  delete: (id: string) =>
    apiClient.delete(`/items/${id}`).then(r => r.data),
};
