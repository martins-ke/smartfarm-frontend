import { apiClient } from "./request";

const unwrap = (res) => (res && res.body !== undefined ? res.body : (res && res.data !== undefined ? res.data : res));

export const recordActivity = async(data)=> apiClient('/activities/record', {method: 'POST', body:JSON.stringify(data)});
export const updateActivity = async(id, data)=> apiClient(`/activities/${id}`, {method: 'PUT', body:JSON.stringify(data)});
export const deleteActivity = async(id)=> apiClient(`/activities/${id}`, {method: 'DELETE'});

export const getLaborAssignments = async(activityId) => {
  const res = await apiClient(`/activities/${activityId}/labor`);
  const data = unwrap(res);
  return Array.isArray(data) ? data : [];
};

export const assignLabor = async(activityId, data) => {
  const res = await apiClient(`/activities/${activityId}/labor`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return unwrap(res);
};