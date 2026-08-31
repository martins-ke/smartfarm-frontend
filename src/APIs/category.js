import { apiClient } from './request';

// Matches the simple apiClient pattern used in season.js
export const getCategories = () => apiClient('/categories/all', { method: 'GET' });
export const getCategory = (categoryId) => apiClient(`/categories/${categoryId}`, { method: 'GET' });
export const createCategory = (data) => apiClient('/categories/create', { method: 'POST', body: JSON.stringify(data) });
export const updateCategory = (categoryId, data) => apiClient(`/categories/${categoryId}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteCategory = (categoryId) => apiClient(`/categories/${categoryId}`, { method: 'DELETE' });
