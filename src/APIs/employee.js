import { apiClient } from './request';

const unwrap = (res) => (res && res.body !== undefined ? res.body : (res && res.data !== undefined ? res.data : res));

export const getEmployees = async (activeOnly = false) => {
  const query = activeOnly ? '?activeOnly=true' : '';
  const res = await apiClient(`/employees${query}`);
  const data = unwrap(res);
  return Array.isArray(data) ? data : [];
};

export const registerEmployee = async (employeeData) => {
  const res = await apiClient('/employees', {
    method: 'POST',
    body: JSON.stringify(employeeData),
  });
  return unwrap(res);
};

export const toggleEmployeeStatus = async (employeeId, status) => {
  const res = await apiClient(`/employees/${employeeId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
  return unwrap(res);
};
