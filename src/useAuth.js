import { create } from 'zustand';
import { normalizeUser } from './utils/accessControl';

const STORAGE_KEY = 'smartfarm-auth-user';

const readStoredUser = () => {
  if (typeof window === 'undefined') return null;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return normalizeUser(JSON.parse(raw));
  } catch {
    return null;
  }
};

const persistUser = (user) => {
  if (typeof window === 'undefined') return;

  if (!user) {
    window.localStorage.removeItem(STORAGE_KEY);
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizeUser(user)));
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