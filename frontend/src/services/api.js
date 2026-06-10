import axios from 'axios';

const getApiOrigin = () => {
  const configuredUrl = import.meta.env.VITE_API_URL?.trim();
  if (!configuredUrl) return '';

  return configuredUrl.replace(/\/+$/, '').replace(/\/api$/, '');
};

export const API_ORIGIN = getApiOrigin();
export const API_BASE_URL = API_ORIGIN ? `${API_ORIGIN}/api` : '/api';

const AUTH_REFRESH_EXCLUDED_PATHS = [
  '/auth/login',
  '/auth/register',
  '/auth/google',
  '/auth/verify-email',
  '/auth/resend-otp',
  '/auth/refresh-token',
  '/auth/forgot-password',
  '/auth/reset-password'
];

const shouldSkipRefresh = (url = '') => {
  const requestPath = url.startsWith('http') ? new URL(url).pathname.replace(/^\/api/, '') : url;
  return AUTH_REFRESH_EXCLUDED_PATHS.some((path) => requestPath.includes(path));
};

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true // send cookies
});

// Outbound request interceptor: Inject Bearer Token and handle FormData
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // For FormData uploads, remove Content-Type header so axios sets it with boundary
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor: Auto Refresh Tokens on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Avoid masking login/register errors or infinite loops when refresh itself fails.
    if (error.response?.status === 401 && !originalRequest._retry && !shouldSkipRefresh(originalRequest.url)) {
      originalRequest._retry = true;

      try {
        const res = await axios.post(`${API_BASE_URL}/auth/refresh-token`, {}, { withCredentials: true });
        if (res.data.success && res.data.token) {
          const newToken = res.data.token;
          localStorage.setItem('accessToken', newToken);
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh token failed/expired: clean storage and force logout
        localStorage.removeItem('accessToken');
        localStorage.removeItem('userInfo');
        // Let application react to clean storage or trigger redirect if needed
        window.dispatchEvent(new Event('auth_session_expired'));
        if (window.location.pathname !== '/login') {
          window.location.assign('/login');
        }
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
