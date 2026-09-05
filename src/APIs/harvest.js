import { apiClient } from "./request";

export const recordHarvest = async(data)=> apiClient('/harvest/record', {method: 'POST', body:JSON.stringify(data)});
export const getHarvestByProjectId = async(projectId)=> apiClient(`/harvest/project/${projectId}`, {method: 'GET'});
export const getHarvestById = async(id)=> apiClient(`/harvest/${id}`, {method: 'GET'});
export const updateHarvest = async(id, data)=> apiClient(`/harvest/${id}`, {method: 'PUT', body:JSON.stringify(data)});
export const deleteHarvest = async(id)=> apiClient(`/harvest/${id}`, {method: 'DELETE'});