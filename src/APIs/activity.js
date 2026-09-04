import { apiClient } from "./request";

export const recordActivity = async(data)=> apiClient('/activities/record', {method: 'POST', body:JSON.stringify(data)});
export const updateActivity = async(id, data)=> apiClient(`/activities/${id}`, {method: 'PUT', body:JSON.stringify(data)});
export const deleteActivity = async(id)=> apiClient(`/activities/${id}`, {method: 'DELETE'});