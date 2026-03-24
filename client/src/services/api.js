import axios from 'axios';

const BASE_URL =
  process.env.REACT_APP_API_URL || 'http://localhost:3002';

console.log("🔥 API BASE URL:", BASE_URL); // ✅ DEBUG

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,   // ✅ IMPORTANT (CORS + cookies)
  timeout: 30000,          // 🔥 FIX: increase timeout (Render sleep)
});

// ── Request interceptor: attach token ──────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('wa_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    console.log("➡️ Request:", config.baseURL + config.url); // ✅ DEBUG
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor: handle 401 / token refresh ──────────
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token);
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    console.log("❌ API ERROR:", error.message); // ✅ DEBUG

    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('wa_refresh_token');

      if (!refreshToken) {
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(error);
      }

      try {
        const { data } = await axios.post(
          `${BASE_URL}/api/auth/refresh`,
          { refreshToken },
          { withCredentials: true } // ✅ IMPORTANT
        );

        localStorage.setItem('wa_token', data.token);
        localStorage.setItem('wa_refresh_token', data.refreshToken);

        api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;

        processQueue(null, data.token);
        originalRequest.headers.Authorization = `Bearer ${data.token}`;

        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;