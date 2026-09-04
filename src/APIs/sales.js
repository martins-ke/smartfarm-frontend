import { apiClient } from "./request";

export const recordSale = async(data)=> apiClient('/sales/create', {method: 'POST', body:JSON.stringify(data)});
export const updateSale = async(id, data)=> apiClient(`/sales/${id}`, {method: 'PUT', body:JSON.stringify(data)});
export const deleteSale = async(id)=> apiClient(`/sales/${id}`, {method: 'DELETE'});
export const requestAllCustomers = async()=> apiClient('/customers/all', {method: 'GET'}); 