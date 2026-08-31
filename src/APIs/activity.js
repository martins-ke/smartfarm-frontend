import { apiClient } from "./request";

export const recordActivity = async(data)=> apiClient('/activities/record', {method: 'POST', body:JSON.stringify(data)});