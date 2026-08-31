import { apiClient } from "./request";

export const createSeason = (data)=> apiClient('/seasons/new', {method: 'POST', body: JSON.stringify(data)});
export const getAllSeasons = ()=> apiClient('/seasons/all/count', {method: 'GET'});
export const getCompleteSeasons = ()=> apiClient('/seasons/complete/count', {method: 'GET'});
export const getSeasons = ()=> apiClient('/seasons/all', {method: 'GET'}); 
