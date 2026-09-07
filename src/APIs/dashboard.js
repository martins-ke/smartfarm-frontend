import { apiClient } from "./request";

export const requestDashboardSummary = async () => apiClient('/dashboard/summary', { method: 'GET' });