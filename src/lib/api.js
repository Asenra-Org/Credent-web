import axios from 'axios';
import { useAuthStore } from '../stores/authStore';
import { isSessionInvalid } from './authErrors';

// Same-origin by default. In development Vite proxies /api to localhost:8000
// (see vite.config.js); in production Vercel rewrites /api to the Render
// service (see vercel.json). Both keep the httpOnly refresh_token cookie
// first-party. Pointing the browser straight at the API host would make it a
// third-party cookie, which browsers increasingly refuse to send - refresh
// would then fail permanently rather than intermittently.
// An explicit VITE_API_URL still wins, so existing deployments are unaffected.
const API_BASE = import.meta.env.VITE_API_URL || '/api/v1';
const API_URL = API_BASE.endsWith('/api/v1') ? API_BASE : `${API_BASE.replace(/\/$/, '')}/api/v1`;

const api = axios.create({
  baseURL: API_URL,
  timeout: 600000,
  withCredentials: true, // CRITICAL: sends refresh_token cookie
});

// Request interceptor: attach Bearer token
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: handle 401 with silent refresh
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        });
      }
      
      originalRequest._retry = true;
      isRefreshing = true;
      
      try {
        const newToken = await useAuthStore.getState().refresh();
        processQueue(null, newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);

        // Only a definitive 401/403 from /auth/refresh proves the session is
        // gone. refresh() has already cleared auth in that case.
        //
        // A timeout or 5xx means the server could not answer - which is
        // exactly what happens while the single worker is busy with an
        // appraisal. Redirecting there would destroy a live run on the
        // strength of a network blip, so authentication state is preserved
        // and the error is handed back for the caller to retry.
        if (isSessionInvalid(refreshError)) {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;
export { API_URL };
