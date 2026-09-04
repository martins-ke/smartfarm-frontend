export const ROLE = {
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER',
  SUPERVISOR: 'SUPERVISOR',
  EMPLOYEE: 'EMPLOYEE',
};

export const EMPLOYMENT_TYPE = {
  TEMPORARY: 'temporary',
  PERMANENT: 'permanent',
};

export const MAX_MANAGERS = 2;
export const MAX_SUPERVISORS = 10;
export const MAX_EMPLOYEES = 50;

export const normalizeRole = (role = '') => String(role || '').toUpperCase();

export const normalizeUser = (user = {}) => ({
  ...user,
  role: normalizeRole(user.role),
  employmentType: user.employmentType ? String(user.employmentType).toLowerCase() : 'temporary',
  permissions: Array.isArray(user.permissions) ? user.permissions : [],
  privileges: Array.isArray(user.privileges) ? user.privileges : [],
  assignedCategories: Array.isArray(user.assignedCategories) ? user.assignedCategories : [],
  managerId: user.managerId ?? null,
  isActive: user.isActive ?? true,
});

export const hasPermission = (user, permission) => {
  if (!user) return false;
  if (user.role === ROLE.ADMIN || user.permissions?.includes('*')) return true;
  return Boolean(user.permissions?.includes(permission));
};

export const canManageUsers = (user) => {
  if (!user) return false;
  return user.role === ROLE.ADMIN || user.role === ROLE.MANAGER;
};

export const canCreateEmployee = (user, employmentType) => {
  if (!user) return false;
  if (user.role === ROLE.ADMIN) return true;
  if (user.role === ROLE.MANAGER) return employmentType === EMPLOYMENT_TYPE.PERMANENT;
  if (user.role === ROLE.SUPERVISOR) return employmentType === EMPLOYMENT_TYPE.TEMPORARY;
  return false;
};

export const canAccessRoute = (user, allowedRoles = []) => {
  if (!user) return false;
  if (!allowedRoles.length) return true;
  return allowedRoles.includes(user.role);
};

export const permissionSummary = (user) => {
  if (!user) return 'No access';
  if (user.role === ROLE.ADMIN) return 'Full platform access';
  if (user.role === ROLE.MANAGER) return 'Project oversight';
  if (user.role === ROLE.SUPERVISOR) return 'Assigned project supervision';
  if (user.role === ROLE.EMPLOYEE) return 'Field work access';
  return 'Restricted access';
};
