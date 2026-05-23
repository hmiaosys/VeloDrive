import apiClient from './client';

export interface DashboardData {
  stats: {
    activeItems: number;
    totalCustomers: number;
    activeBookings: number;
    outstanding: number;
    revenueMtd: number;
  };
  upcomingBookings: Array<{
    id: string;
    bookingNumber: string;
    customerName: string;
    startDate: string;
    totalAmount: number;
    status: string;
  }>;
  outstandingInvoices: Array<{
    id: string;
    invoiceNumber: string;
    customerName: string;
    amountDue: number;
    dueAt: string;
    status: string;
  }>;
}

export const dashboardApi = {
  get: () =>
    apiClient.get<DashboardData>('/dashboard').then(r => r.data),
};
