import { apiClient } from './request';

const unwrap = (res) => (res && res.body !== undefined ? res.body : (res && res.data !== undefined ? res.data : res));

export const getNotifications = async () => {
  try {
    const res = await apiClient('/notifications');
    return unwrap(res) || { unreadCount: 0, totalCount: 0, notifications: [] };
  } catch (_err) {
    return { unreadCount: 0, totalCount: 0, notifications: [] };
  }
};
