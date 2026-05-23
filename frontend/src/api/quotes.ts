import apiClient from './client';

export const quotesApi = {
  getAll: (status?: string) =>
    apiClient.get('/quotes', { params: { status: status || undefined } }).then(r => r.data),
  getById: (id: string) =>
    apiClient.get(`/quotes/${id}`).then(r => r.data),
  create: (bookingId: string) =>
    apiClient.post(`/quotes?bookingId=${bookingId}`).then(r => r.data),
  send: (id: string) =>
    apiClient.post(`/quotes/${id}/send`).then(r => r.data),
  accept: (id: string) =>
    apiClient.post(`/quotes/${id}/accept`).then(r => r.data),
};
