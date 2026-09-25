import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import * as authApi from '../api/auth';
import {
  getStoredUser,
  setAuth,
  clearAuth,
  AUTH_CHANGED_EVENT,
  type AuthUser,
} from '../utils/authStorage';

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, phone?: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    function sync() {
      setUser(getStoredUser());
    }
    sync();
    window.addEventListener(AUTH_CHANGED_EVENT, sync);
    return () => window.removeEventListener(AUTH_CHANGED_EVENT, sync);
  }, []);

  async function login(email: string, password: string) {
    const data = await authApi.login({ email, password });
    setAuth(data.user, data.accessToken, data.refreshToken);
  }

  async function register(name: string, email: string, password: string, phone?: string) {
    const data = await authApi.register({ name, email, password, phone });
    setAuth(data.user, data.accessToken, data.refreshToken);
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

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth phải dùng bên trong AuthProvider');
  return ctx;
}
