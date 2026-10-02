import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import * as authApi from '../api/auth';
import {
  getStoredUser,
  getAccessToken,
  setAuth,
  clearAuth,
  updateStoredUser,
  AUTH_CHANGED_EVENT,
  type AuthUser,
} from '../utils/authStorage';

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  register: (name: string, email: string, password: string, phone?: string) => Promise<AuthUser>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth phải dùng bên trong AuthProvider');
  return ctx;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  // Khởi tạo NGAY từ localStorage (không đợi useEffect) - SPA thuần không có
  // SSR nên đọc đồng bộ ở đây an toàn. Trước đây khởi tạo null rồi mới đồng
  // bộ trong useEffect khiến AdminLayout kiểm tra isAuthenticated ở lần
  // render ĐẦU (trước khi effect chạy) luôn thấy false -> đá khỏi trang admin
  // dù đã đăng nhập, mỗi khi tải lại trang hoặc gõ thẳng URL.
  const [user, setUser] = useState<AuthUser | null>(() => getStoredUser());

  useEffect(() => {
    function sync() {
      setUser(getStoredUser());
    }
    window.addEventListener(AUTH_CHANGED_EVENT, sync);
    return () => window.removeEventListener(AUTH_CHANGED_EVENT, sync);
  }, []);

  // Mỗi lần mở web: hỏi lại server "tôi là ai" để đồng bộ quyền/tên mới nhất.
  // Phiên hỏng (tài khoản bị xoá, token hết hạn hẳn) thì tự đăng xuất - interceptor
  // trong api/http.ts đã lo phần 401.
  useEffect(() => {
    if (!getAccessToken()) return;
    authApi
      .getMe()
      .then((me) => updateStoredUser(me))
      .catch(() => {
        /* lỗi mạng: giữ nguyên phiên cũ, 401 đã được interceptor xử lý */
      });
  }, []);

  async function login(email: string, password: string) {
    const data = await authApi.login({ email, password });
    setAuth(data.user, data.accessToken, data.refreshToken);
    return data.user as AuthUser;
  }

  async function register(name: string, email: string, password: string, phone?: string) {
    const data = await authApi.register({ name, email, password, phone });
    setAuth(data.user, data.accessToken, data.refreshToken);
    return data.user as AuthUser;
  }

  function logout() {
    clearAuth();
  }

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
