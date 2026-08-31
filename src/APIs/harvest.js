import { apiClient } from "./request";

export const recordHarvest = async(data)=> apiClient('/harvest/record', {method: 'POST', body:JSON.stringify(data)});