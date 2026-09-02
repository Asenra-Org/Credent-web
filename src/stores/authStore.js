import { create } from "zustand";
import axios from "axios";
import {
  MAX_REFRESH_ATTEMPTS,
  SessionExpiredError,
  TransientAuthError,
  classifyRefreshFailure,
  refreshBackoffMs,
} from "../lib/authErrors";

const API_BASE = import.meta.env.VITE_API_URL || "/api/v1";
const API_URL = API_BASE.endsWith("/api/v1") ? API_BASE : `${API_BASE.replace(/\/$/, "")}/api/v1`;

const authApi = axios.create({
  baseURL: API_URL,
  timeout: 60000,
  withCredentials: true,
});

export const useAuthStore = create((set, get) => ({
  accessToken: null,
  user: null,
  isLoading: false,
  error: null,
  isAuthenticated: false,
  _refreshTimer: null,

  _scheduleProactiveRefresh: () => {
    const existing = get()._refreshTimer;
    if (existing) clearTimeout(existing);
    const timer = setTimeout(async () => {
      if (!get().isAuthenticated) return;
      try {
        await get().refresh();
        get()._scheduleProactiveRefresh();
      } catch (err) {
        if (!err?.sessionInvalid) {
          const retryTimer = setTimeout(() => get()._scheduleProactiveRefresh(), 5 * 60 * 1000);
          set({ _refreshTimer: retryTimer });
        }
      }
    }, 45 * 60 * 1000);
    set({ _refreshTimer: timer });
  },

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const res = await authApi.post("/auth/login", { email, password });
      if (res.data.mfa_required) {
        set({ isLoading: false });
        return { mfa_required: true, challenge_token: res.data.challenge_token };
      }
      const token = res.data.access_token;
      set({ accessToken: token, isLoading: false });
      await get().fetchProfile(token);
      get()._scheduleProactiveRefresh();
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.detail || "Login failed";
      set({ isLoading: false, error: message });
      throw new Error(message);
    }
  },

  verifyMfa: async (challengeToken, code) => {
    set({ isLoading: true, error: null });
    try {
      const res = await authApi.post("/auth/mfa/verify-login", { challenge_token: challengeToken, code });
      const token = res.data.access_token;
      set({ accessToken: token, isLoading: false });
      await get().fetchProfile(token);
      get()._scheduleProactiveRefresh();
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.detail || "MFA verification failed";
      set({ isLoading: false, error: message });
      throw new Error(message);
    }
  },

  fetchProfile: async (token) => {
    try {
      const res = await authApi.get("/admin/me", { headers: { Authorization: `Bearer ${token}` } });
      set({ user: res.data, isAuthenticated: true });
    } catch (err) {
      console.error("Failed to fetch profile:", err);
    }
  },

  refresh: async () => {
    let lastError = null;
    for (let attempt = 0; attempt < MAX_REFRESH_ATTEMPTS; attempt += 1) {
      try {
        const res = await authApi.post("/auth/refresh");
        const token = res.data.access_token;
        set({ accessToken: token, isAuthenticated: true });
        if (!get().user) await get().fetchProfile(token);
        return token;
      } catch (err) {
        lastError = err;
        if (classifyRefreshFailure(err) === "invalid") {
          get().clearAuth();
          throw new SessionExpiredError(err?.response?.status);
        }
        if (attempt < MAX_REFRESH_ATTEMPTS - 1) {
          await new Promise((resolve) => setTimeout(resolve, refreshBackoffMs(attempt)));
        }
      }
    }
    throw new TransientAuthError(lastError, MAX_REFRESH_ATTEMPTS);
  },

  logout: async () => {
    const timer = get()._refreshTimer;
    if (timer) clearTimeout(timer);
    set({ _refreshTimer: null });
    try { await authApi.post("/auth/logout"); } catch (err) {}
    get().clearAuth();
  },

  clearAuth: () => {
    const timer = get()._refreshTimer;
    if (timer) clearTimeout(timer);
    set({ accessToken: null, user: null, isAuthenticated: false, error: null, _refreshTimer: null });
  },

  hasRole: (role) => { const user = get().user; if (!user) return false; return user.role === role; },
  hasAnyRole: (roles) => { const user = get().user; if (!user) return false; return roles.includes(user.role); },
}));
