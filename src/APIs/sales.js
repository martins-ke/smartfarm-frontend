import { apiClient } from "./request";

export const recordSale = async(data)=> apiClient('/sales/create', {method: 'POST', body:JSON.stringify(data)});
export const updateSale = async(id, data)=> apiClient(`/sales/${id}`, {method: 'PUT', body:JSON.stringify(data)});
export const deleteSale = async(id)=> apiClient(`/sales/${id}`, {method: 'DELETE'});
export const requestAllCustomers = async()=> apiClient('/customers/all', {method: 'GET'});
export const getAllSales = async (page = 0, size = 50) => {
  try {
    const res = await apiClient(`/sales/all?page=${page}&size=${size}`);
    const data = res?.body?.content || res?.body || res?.data || [];
    return Array.isArray(data) ? data : [];
  } catch (_err) {
    return [];
  }
}; 