import { apiClient } from "./request";

export const requestProjectsSummary = async()=> apiClient('/projects/summary', {method: 'GET'});