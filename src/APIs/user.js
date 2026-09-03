import { apiClient } from './request';

/**
 * GET /users/check-bootstrap
 */
export const checkBootstrapStatus = () => apiClient('/users/check-bootstrap', { method: 'GET' });

/**
 * POST /users/signup
 */
export const signup = ({ username, email, password, cpassword, role }) =>
  apiClient('/users/signup', {
    method: 'POST',
    body: JSON.stringify({ username, email, password, cpassword, role }),
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
 * POST /users/forgot-password
 */
export const forgotPassword = ({ email }) =>
  apiClient('/users/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });

/**
 * POST /users/reset-password
 */
export const resetPassword = ({ token, newPassword }) =>
  apiClient('/users/reset-password', {
    method: 'POST',
    body: JSON.stringify({ token, newPassword }),
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
export const createStaff = ({ username, email, password, role, createdById }) =>
  apiClient('/users/create', {
    method: 'POST',
    body: JSON.stringify({ username, email, password, role, createdById }),
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
 * PATCH /users/:id/admin-reset-password
 */
export const adminResetPassword = (id, newPassword) =>
  apiClient(`/users/${id}/admin-reset-password`, {
    method: 'PATCH',
    body: JSON.stringify({ newPassword }),
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

/**
 * PUT /users/:id/profile
 */
export const updateUserProfile = (id, data) =>
  apiClient(`/users/${id}/profile`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });

export default {
  checkBootstrapStatus,
  signup,
  loginUser,
  forgotPassword,
  resetPassword,
  fetchUsers,
  createStaff,
  updateUserStatus,
  assignCategoriesToUser,
  assignProjectsToSupervisor,
  getSupervisorProjects,
  deleteUser,
  updateUserProfile,
  assignSupervisorToProject,
  adminResetPassword,
};
