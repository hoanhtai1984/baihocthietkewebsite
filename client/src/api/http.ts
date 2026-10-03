import axios, { type AxiosRequestConfig } from 'axios';
import type { ApiEnvelope, Paginated } from '../types';
import { getAccessToken, getRefreshToken, setTokens, clearAuth } from '../utils/authStorage';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api/v1';

const http = axios.create({ baseURL });

http.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Nhiều request cùng hết hạn token thì chỉ gọi refresh 1 lần (refresh token xoay
// vòng - gọi 2 lần song song bằng cùng 1 token sẽ khiến lần thứ 2 bị từ chối).
let refreshPromise: Promise<string | null> | null = null;

async function tryRefresh(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;
  try {
    const { data } = await axios.post<ApiEnvelope<{ accessToken: string; refreshToken: string }>>(
      `${baseURL}/auth/refresh`,
      { refreshToken },
    );
    setTokens(data.data.accessToken, data.data.refreshToken);
    return data.data.accessToken;
  } catch {
    clearAuth();
    return null;
  }
}

type RetriableConfig = AxiosRequestConfig & { _retry?: boolean };

http.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config as RetriableConfig | undefined;
    // Chỉ thử refresh đúng 1 lần cho mỗi request để tránh vòng lặp vô hạn
    // khi refreshToken cũng đã hết hạn. Không refresh cho chính các API auth.
    const isAuthCall = /\/auth\/(login|register|refresh)/.test(original?.url || '');
    if (original && error.response?.status === 401 && !original._retry && !isAuthCall && getRefreshToken()) {
      original._retry = true;
      refreshPromise = refreshPromise || tryRefresh();
      const newToken = await refreshPromise;
      refreshPromise = null;
      if (newToken) {
        original.headers = { ...original.headers, Authorization: `Bearer ${newToken}` };
        return http(original);
      }
    }
    return Promise.reject(error);
  },
);

// Bóc lớp bọc { success, data } của API - các hàm trong api/* chỉ trả phần data.
export async function unwrap<T>(request: Promise<{ data: ApiEnvelope<T> }>): Promise<T> {
  return (await request).data.data;
}

// Danh sách có phân trang: trả { items, meta }.
export async function unwrapList<T>(request: Promise<{ data: ApiEnvelope<T[]> }>): Promise<Paginated<T>> {
  const body = (await request).data;
  const items = body.data;
  return {
    items,
    meta: body.meta ?? { total: items.length, page: 1, limit: items.length || 1, totalPages: 1, hasNext: false, hasPrev: false },
  };
}

export default http;
