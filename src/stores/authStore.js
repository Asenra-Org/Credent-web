import { create } from 'zustand';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';
const API_URL = API_BASE.endsWith('/api/v1') ? API_BASE : `${API_BASE.replace(/\/$/, '')}/api/v1`;

// Separate axios instance for auth calls to avoid interceptor loops
const authApi = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  withCredentials: true,
});

export const useAuthStore = create((set, get) => ({
  accessToken: null,
  user: null, // { user_id, email, role, organization: { id, name } }
  isLoading: false,
  error: null,
  isAuthenticated: false,

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const res = await authApi.post('/auth/login', { email, password });
      
      if (res.data.mfa_required) {
        set({ isLoading: false });
        return { mfa_required: true, challenge_token: res.data.challenge_token };
      }
      
      const token = res.data.access_token;
      set({ accessToken: token, isLoading: false });
      
      // Fetch user profile
      await get().fetchProfile(token);
      
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.detail || 'Login failed';
      set({ isLoading: false, error: message });
      throw new Error(message);
    }
  },

  verifyMfa: async (challengeToken, code) => {
    set({ isLoading: true, error: null });
    try {
      const res = await authApi.post('/auth/mfa/verify-login', {
        challenge_token: challengeToken,
        code: code,
      });
      
      const token = res.data.access_token;
      set({ accessToken: token, isLoading: false });
      
      await get().fetchProfile(token);
      
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.detail || 'MFA verification failed';
      set({ isLoading: false, error: message });
      throw new Error(message);
    }
  },

  fetchProfile: async (token) => {
    try {
      const res = await authApi.get('/admin/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      set({
        user: res.data,
        isAuthenticated: true,
      });
    } catch (err) {
      console.error('Failed to fetch profile:', err);
    }
  },

  refresh: async () => {
    try {
      const res = await authApi.post('/auth/refresh');
      const token = res.data.access_token;
      set({ accessToken: token, isAuthenticated: true });
      
      // Refresh profile too
      if (!get().user) {
        await get().fetchProfile(token);
      }
      
      return token;
    } catch (err) {
      get().clearAuth();
      throw err;
    }
  },

  logout: async () => {
    try {
      await authApi.post('/auth/logout');
    } catch (err) {
      // Logout should always succeed on client side
    }
    get().clearAuth();
  },

  clearAuth: () => {
    set({
      accessToken: null,
      user: null,
      isAuthenticated: false,
      error: null,
    });
  },

  hasRole: (role) => {
    const user = get().user;
    if (!user) return false;
    return user.role === role;
  },

  hasAnyRole: (roles) => {
    const user = get().user;
    if (!user) return false;
    return roles.includes(user.role);
  },
}));
