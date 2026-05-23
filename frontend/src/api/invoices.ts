import apiClient from './client';

export const invoicesApi = {
  getAll: (params?: { type?: string; status?: string; bookingId?: string }) =>
    apiClient.get('/invoices', { params }).then(r => r.data),
  getById: (id: string) =>
    apiClient.get(`/invoices/${id}`).then(r => r.data),
  create: (data: { bookingId: string; type: string; amount: number; dueInDays?: number }) =>
    apiClient.post('/invoices', data).then(r => r.data),
  recordPayment: (id: string, data: { amount: number; method: string; reference?: string; notes?: string }) =>
    apiClient.post(`/invoices/${id}/payments`, data).then(r => r.data),
  send: (id: string) =>
    apiClient.post(`/invoices/${id}/send`).then(r => r.data),
};
