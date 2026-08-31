import { apiClient } from './request';

/**
 * GET /users/check-bootstrap
 */
export const checkBootstrapStatus = () => apiClient('/users/check-bootstrap', { method: 'GET' });

/**
 * POST /users/signup
 */
export const signup = ({ username, password, cpassword, role }) =>
  apiClient('/users/signup', {
    method: 'POST',
    body: JSON.stringify({ username, password, cpassword, role }),
  });

/**
 * POST /users/login
 */
export const loginUser = ({ username, password }) =>
  apiClient('/users/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });

/**
 * GET /users?role=...&createdById=...
 */
export const fetchUsers = (role, createdById) => {
  const params = new URLSearchParams();
  if (role) params.append('role', role);
  if (createdById) params.append('createdById', createdById);
  const query = params.toString() ? `?${params.toString()}` : '';
  return apiClient(`/users${query}`, { method: 'GET' });
};

/**
 * GET /users/:id
 */
export const getUserById = (id) =>
  apiClient(`/users/${id}`, { method: 'GET' });

/**
 * POST /users/create
 */
export const createStaff = ({ username, password, role, createdById }) =>
  apiClient('/users/create', {
    method: 'POST',
    body: JSON.stringify({ username, password, role, createdById }),
  });

/**
 * PATCH /users/:id/status
 */
export const updateUserStatus = (id, status) =>
  apiClient(`/users/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });

/**
 * PUT /users/:id/categories
 */
export const assignCategoriesToUser = (id, categoryIds) =>
  apiClient(`/users/${id}/categories`, {
    method: 'PUT',
    body: JSON.stringify({ categoryIds }),
  });

/**
 * DELETE /users/:id
 */
export const deleteUser = (id) =>
  apiClient(`/users/${id}`, { method: 'DELETE' });

/**
 * PUT /users/:id/projects
 */
export const assignProjectsToSupervisor = (supervisorId, projectIds) =>
  apiClient(`/users/${supervisorId}/projects`, {
    method: 'PUT',
    body: JSON.stringify({ projectIds }),
  });

/**
 * GET /users/:id/projects
 */
export const getSupervisorProjects = (supervisorId) =>
  apiClient(`/users/${supervisorId}/projects`, { method: 'GET' });

/**
 * PATCH /projects/:id/assign-supervisor
 */
export const assignSupervisorToProject = (projectId, supervisorId) =>
  apiClient(`/projects/${projectId}/assign-supervisor`, {
    method: 'PATCH',
    body: JSON.stringify({ supervisorId }),
  });

export default {
  checkBootstrapStatus,
  signup,
  loginUser,
  fetchUsers,
  createStaff,
  updateUserStatus,
  assignCategoriesToUser,
  assignProjectsToSupervisor,
  getSupervisorProjects,
  deleteUser,
  assignSupervisorToProject,
};
