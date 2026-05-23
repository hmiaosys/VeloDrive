import apiClient from './client';

export interface CustomerResponse {
  id: string;
  firstName: string;
  lastName: string;
  companyName: string | null;
  email: string | null;
  phone: string | null;
  billingAddress: string | null;
  notes: string | null;
  source: string | null;
  totalBookings: number;
  totalRevenue: number;
  createdOnUtc: string;
}

export const customersApi = {
  getAll: (search?: string) =>
    apiClient.get<CustomerResponse[]>('/customers', { params: { search } }).then(r => r.data),
  getById: (id: string) =>
    apiClient.get<{customer: CustomerResponse; recentBookings: any[]}>(`/customers/${id}`).then(r => r.data),
  create: (data: any) =>
    apiClient.post<CustomerResponse>('/customers', data).then(r => r.data),
  update: (id: string, data: any) =>
    apiClient.put<CustomerResponse>(`/customers/${id}`, data).then(r => r.data),
};
