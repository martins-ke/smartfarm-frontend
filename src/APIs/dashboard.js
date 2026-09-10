import { apiClient } from "./request";

export const requestDashboardSummary = async () => apiClient('/dashboard/summary', { method: 'GET' });

export const requestDashboardTransactions = async ({ page = 1, size = 5, filter = 'ALL', search = '' } = {}) => {
  const params = new URLSearchParams();
  if (page) params.append('page', page);
  if (size) params.append('size', size);
  if (filter) params.append('filter', filter);
  if (search) params.append('search', search);
  return apiClient(`/dashboard/transactions?${params.toString()}`, { method: 'GET' });
};