import { apiClient } from './request';

export const getInventoryItems = async (page = 0, size = 20) => {
  return apiClient(`/inventory?page=${page}&size=${size}`, { method: 'GET' });
};

export const addInventoryItem = async (data) => {
  return apiClient('/inventory', { method: 'POST', body: JSON.stringify(data) });
};

export const updateInventoryItem = async (id, data) => {
  return apiClient(`/inventory/${id}`, { method: 'PUT', body: JSON.stringify(data) });
};

export const deleteInventoryItem = async (id) => {
  return apiClient(`/inventory/${id}`, { method: 'DELETE' });
};

export const useInventoryItem = async (id, payload) => {
  return apiClient(`/inventory/${id}/use`, { method: 'POST', body: JSON.stringify(payload) });
};
