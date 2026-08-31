import { apiClient } from "./request";

export const recordSale = async(data)=> apiClient('/sales/create', {method: 'POST', body:JSON.stringify(data)});
export const requestAllCustomers = async()=> apiClient('/customers/all', {method: 'GET'}); 