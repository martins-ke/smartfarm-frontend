import { create } from 'zustand';
import { normalizeUser } from './utils/accessControl';

const STORAGE_KEY = 'smartfarm-auth-user';

const readStoredUser = () => {
  if (typeof window === 'undefined') return null;

  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY) || window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return normalizeUser(JSON.parse(raw));
  } catch {
    return null;
  }
};

const persistUser = (user) => {
  if (typeof window === 'undefined') return;

  if (!user) {
    window.sessionStorage.removeItem(STORAGE_KEY);
    window.localStorage.removeItem(STORAGE_KEY);
    return;
  }

  const normalized = JSON.stringify(normalizeUser(user));
  window.sessionStorage.setItem(STORAGE_KEY, normalized);
  // Clear from localStorage so tabs remain strictly isolated
  window.localStorage.removeItem(STORAGE_KEY);
};

export const useAuth = create((set) => ({
  user: readStoredUser(),
  login: (user) => {
    const normalizedUser = normalizeUser(user);
    persistUser(normalizedUser);
    set({ user: normalizedUser });
  },
  logout: () => {
    persistUser(null);
    set({ user: null });
  },
  updateUser: (user) => {
    const normalizedUser = normalizeUser(user);
    persistUser(normalizedUser);
    set({ user: normalizedUser });
  },
}));

export default useAuth;