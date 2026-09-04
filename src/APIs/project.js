import { apiClient } from './request';

export const getProjectsByCategory = async (category_id, category, page = 0, size = 20) => {
  return await apiClient(`/projects/${category_id}/${category}?page=${page}&size=${size}`, { method: 'GET' });
};

export const createProject = (projectData) => {
  return apiClient('/projects/create', { method: 'POST', body: JSON.stringify(projectData) });
};

export const getProjectById = async (projectId) => {
  return await apiClient(`/projects/${projectId}`, { method: 'GET' });
};

export const submitProjectRecord = (category, projectId, type, payload) => {
  return apiClient(`/categories/${category}/projects/${projectId}/${type}`, { method: 'POST', body: JSON.stringify(payload) });
};

export const getAllProjects = () =>
  apiClient('/projects/all', { method: 'GET' });

export const assignSupervisorToProject = (projectId, supervisorId) =>
  apiClient(`/projects/${projectId}/assign-supervisor`, {
    method: 'PATCH',
    body: JSON.stringify({ supervisorId }),
  });

export const updateProject = (projectId, data) =>
  apiClient(`/projects/${projectId}`, { method: 'PUT', body: JSON.stringify(data) });

export const updateProjectStatus = (projectId, status) =>
  apiClient(`/projects/${projectId}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });

export const deleteProject = (projectId) =>
  apiClient(`/projects/${projectId}`, { method: 'DELETE' });
