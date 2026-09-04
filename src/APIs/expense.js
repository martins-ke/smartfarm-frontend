import { apiClient } from "./request";

export const createExpense = (data)=> apiClient('/expenses/create', {method: 'POST', body:JSON.stringify(data)});
export const updateExpense = (id, data) => apiClient(`/expenses/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteExpense = (id) => apiClient(`/expenses/${id}`, { method: 'DELETE' });