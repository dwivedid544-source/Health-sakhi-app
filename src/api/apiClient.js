import axios from 'axios';
import storage from '../utils/storage';

const LIVE_URL = 'https://health-sakhi-backend-production-21b3.up.railway.app/api/v1';
const rawUrl = process.env.EXPO_PUBLIC_API_URL || '';
const API_BASE_URL = (!rawUrl || rawUrl.includes('health-sakhi-backend-production.up.railway.app'))
  ? LIVE_URL
  : rawUrl;

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to append bearer token and active language header to requests (1:1 matching web frontend axiosClient)
apiClient.interceptors.request.use(
  async (config) => {
    const token = await storage.getItem('hs_access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    const activeLang = (await storage.getItem('hs_lang_code')) || 'en';
    config.headers['Accept-Language'] = activeLang;
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor to handle token refresh and auth errors
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = await storage.getItem('hs_refresh_token');
      if (refreshToken) {
        try {
          const res = await axios.post(`${API_BASE_URL}/auth/refresh-token`, {
            refreshToken,
          });

          if (res.data && res.data.success) {
            const { accessToken, refreshToken: newRefreshToken } = res.data;
            await storage.setItem('hs_access_token', accessToken);
            await storage.setItem('hs_refresh_token', newRefreshToken);

            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            return apiClient(originalRequest);
          }
        } catch (refreshError) {
          // Invalidate tokens
          await storage.removeItem('hs_access_token');
          await storage.removeItem('hs_refresh_token');
          await storage.removeItem('hs_current_member');
          await storage.removeItem('temp_role');
          
          return Promise.reject(new Error('AUTH_EXPIRED'));
        }
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
export { API_BASE_URL };
