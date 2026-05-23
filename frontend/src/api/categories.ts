import apiClient from './client';

export interface CategoryResponse {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  attributeSchema: string | null;
  displayOrder: number;
  isActive: boolean;
  itemCount: number;
  createdOnUtc: string;
}

export interface CreateCategoryRequest {
  name: string;
  slug: string;
  description?: string;
  attributeSchema?: string;
  displayOrder?: number;
}

export const categoriesApi = {
  getAll: () =>
    apiClient.get<CategoryResponse[]>('/categories').then(r => r.data),

  getById: (id: string) =>
    apiClient.get<CategoryResponse>(`/categories/${id}`).then(r => r.data),

  create: (data: CreateCategoryRequest) =>
    apiClient.post<CategoryResponse>('/categories', data).then(r => r.data),

  update: (id: string, data: CreateCategoryRequest) =>
    apiClient.put<CategoryResponse>(`/categories/${id}`, data).then(r => r.data),

  delete: (id: string) =>
    apiClient.delete(`/categories/${id}`).then(r => r.data),
};
