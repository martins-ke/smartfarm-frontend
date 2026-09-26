import { create } from 'zustand';
import { normalizeUser } from './utils/accessControl';

const STORAGE_KEY = 'smartfarm-auth-user';
const TOKEN_KEY = 'smartfarm-jwt';

const readStoredUser = () => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY)
             || window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return normalizeUser(JSON.parse(raw));
  } catch {
    return null;
  }
};

const persistUser = (user, token) => {
  if (typeof window === 'undefined') return;

  if (!user) {
    window.sessionStorage.removeItem(STORAGE_KEY);
    window.sessionStorage.removeItem(TOKEN_KEY);
    window.localStorage.removeItem(STORAGE_KEY);
    window.localStorage.removeItem(TOKEN_KEY);
    return;
  }

  const normalized = JSON.stringify(normalizeUser(user));
  window.sessionStorage.setItem(STORAGE_KEY, normalized);
  window.localStorage.removeItem(STORAGE_KEY);

  if (token) {
    window.sessionStorage.setItem(TOKEN_KEY, token);
    window.localStorage.removeItem(TOKEN_KEY);
  }
};

export const useAuth = create((set) => ({
  user: readStoredUser(),
  // supports login({ user, token }) and legacy login(user)
  login: (authData) => {
    if (!authData) return;
    const user = authData.user ? authData.user : authData;
    const token = authData.token || (typeof window !== 'undefined' ? (window.sessionStorage.getItem(TOKEN_KEY) || window.localStorage.getItem(TOKEN_KEY)) : null);
    const normalizedUser = normalizeUser(user);
    persistUser(normalizedUser, token);
    set({ user: normalizedUser });
  },
  logout: () => {
    persistUser(null, null);
    set({ user: null });
  },
  updateUser: (user) => {
    // When updating user profile, preserve the existing token
    const existingToken = window.sessionStorage.getItem(TOKEN_KEY)
                       || window.localStorage.getItem(TOKEN_KEY);
    const normalizedUser = normalizeUser(user);
    persistUser(normalizedUser, existingToken);
    set({ user: normalizedUser });
  },
}));

export default useAuth;