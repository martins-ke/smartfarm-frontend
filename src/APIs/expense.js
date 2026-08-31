import { apiClient } from "./request";

export const createExpense = (data)=> apiClient('/expenses/create', {method: 'POST', body:JSON.stringify(data)});