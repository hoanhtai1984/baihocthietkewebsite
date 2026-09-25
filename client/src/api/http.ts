import axios from 'axios';
import { getAccessToken, getRefreshToken, setAccessToken, clearAuth } from '../utils/authStorage';

const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000/api',
});

http.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let refreshPromise: Promise<string | null> | null = null;

async function tryRefresh(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;
  try {
    const { data } = await axios.post(`${http.defaults.baseURL}/auth/refresh`, { refreshToken });
    setAccessToken(data.accessToken);
    return data.accessToken;
  } catch {
    clearAuth();
    return null;
  }
}

http.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    // Chỉ thử refresh đúng 1 lần cho mỗi request để tránh vòng lặp vô hạn
    // khi refreshToken cũng đã hết hạn.
    if (error.response?.status === 401 && !original._retry && getRefreshToken()) {
      original._retry = true;
      refreshPromise = refreshPromise || tryRefresh();
      const newToken = await refreshPromise;
      refreshPromise = null;
      if (newToken) {
        original.headers.Authorization = `Bearer ${newToken}`;
        return http(original);
      }
    }
    return Promise.reject(error);
  },
);

export default http;
