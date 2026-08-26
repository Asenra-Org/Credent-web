import { create } from 'zustand';
import axios from 'axios';
import {
  MAX_REFRESH_ATTEMPTS,
  SessionExpiredError,
  TransientAuthError,
  classifyRefreshFailure,
  refreshBackoffMs,
} from '../lib/authErrors';

// Same-origin by default, matching lib/api.js - see the note there.
const API_BASE = import.meta.env.VITE_API_URL || '/api/v1';
const API_URL = API_BASE.endsWith('/api/v1') ? API_BASE : `${API_BASE.replace(/\/$/, '')}/api/v1`;

// Separate axios instance for auth calls to avoid interceptor loops
const authApi = axios.create({
  baseURL: API_URL,
  // A cold Render instance, or one busy with an appraisal, routinely needs
  // longer than 30s to answer. Timing out early used to look like a logout.
  timeout: 60000,
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

  /**
   * Exchange the refresh cookie for a new access token.
   *
   * Authentication is cleared ONLY when the server definitively says the
   * session is invalid (401/403). A timeout, a 5xx or a rate limit means the
   * server could not answer - not that the user is signed out - so those are
   * retried with bounded backoff and then reported as transient, leaving the
   * session intact.
   *
   * This is the fix for analysts being ejected mid-appraisal: the single
   * backend worker is busy doing OCR, refresh times out, and the old code read
   * that as "session expired".
   */
  refresh: async () => {
    let lastError = null;

    for (let attempt = 0; attempt < MAX_REFRESH_ATTEMPTS; attempt += 1) {
      try {
        const res = await authApi.post('/auth/refresh');
        const token = res.data.access_token;
        set({ accessToken: token, isAuthenticated: true });

        if (!get().user) {
          await get().fetchProfile(token);
        }
        return token;
      } catch (err) {
        lastError = err;

        if (classifyRefreshFailure(err) === 'invalid') {
          // The server is certain. Sign out.
          get().clearAuth();
          throw new SessionExpiredError(err?.response?.status);
        }

        // Transient. Back off and try again, unless this was the last attempt.
        if (attempt < MAX_REFRESH_ATTEMPTS - 1) {
          await new Promise((resolve) => setTimeout(resolve, refreshBackoffMs(attempt)));
        }
      }
    }

    // Out of attempts. The session has NOT been proven invalid, so auth state
    // is deliberately preserved and the caller decides what to do.
    throw new TransientAuthError(lastError, MAX_REFRESH_ATTEMPTS);
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
