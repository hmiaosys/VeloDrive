import apiClient from './client';

export interface BookingResponse {
  id: string;
  bookingNumber: string;
  customerId: string;
  customerName: string;
  status: string;
  startDate: string;
  endDate: string;
  pickupTime: string | null;
  returnTime: string | null;
  pickupLocation: string | null;
  dropoffLocation: string | null;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  depositRequired: number;
  customerNotes: string | null;
  internalNotes: string | null;
  createdOnUtc: string;
  items: BookingLineResponse[];
  addOns: BookingAddOnLineResponse[];
}

export interface BookingLineResponse {
  id: string;
  itemId: string;
  itemName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface BookingAddOnLineResponse {
  id: string;
  addOnId: string;
  addOnName: string;
  bookingItemId: string | null;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export const bookingsApi = {
  getAll: (params?: { status?: string; customerId?: string; from?: string; to?: string }) =>
    apiClient.get<BookingResponse[]>('/bookings', { params }).then(r => r.data),
  getById: (id: string) =>
    apiClient.get<{booking: BookingResponse; invoices: any[]}>(`/bookings/${id}`).then(r => r.data),
  create: (data: any) =>
    apiClient.post<BookingResponse>('/bookings', data).then(r => r.data),
  updateStatus: (id: string, status: string) =>
    apiClient.post(`/bookings/${id}/status`, { status }).then(r => r.data),
};
