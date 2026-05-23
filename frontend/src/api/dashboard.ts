import apiClient from './client';

export interface DashboardData {
  stats: {
    itemsOutNow: number;
    availableToday: number;
    pendingQuotes: number;
    activeThisWeek: number;
  };
  todaySchedule: Array<{
    id: string;
    bookingNumber: string;
    startDate: string;
    endDate: string;
    pickupTime: string | null;
    returnTime: string | null;
    pickupLocation: string | null;
    dropoffLocation: string | null;
    customerName: string;
    phone: string | null;
    items: string[];
  }>;
  needsAttention: {
    draftBookings: Array<{
      id: string;
      bookingNumber: string;
      customerName: string;
      startDate: string;
      createdOnUtc: string;
    }>;
    expiringQuotes: Array<{
      id: string;
      quoteNumber: string;
      customerName: string;
      totalAmount: number;
      validUntil: string;
    }>;
    unpaidInvoices: Array<{
      id: string;
      invoiceNumber: string;
      customerName: string;
      amountDue: number;
      dueAt: string;
      status: string;
    }>;
  };
}

export const dashboardApi = {
  get: () =>
    apiClient.get<DashboardData>('/dashboard').then(r => r.data),
};
