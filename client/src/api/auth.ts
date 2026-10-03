import http, { unwrap } from './http';
import type { AuthUser } from '../utils/authStorage';

export interface Session {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
}

export function register(data: { name: string; email: string; password: string; phone?: string }) {
  return unwrap<Session>(http.post('/auth/register', data));
}

export function login(data: { email: string; password: string }) {
  return unwrap<Session>(http.post('/auth/login', data));
}

// Nhận access token làm tham số: lúc đăng xuất client xoá token cục bộ ngay, mà
// interceptor của axios đọc token bất đồng bộ - không truyền sẵn thì request
// đăng xuất bị gửi đi KHÔNG kèm token và server từ chối 401.
export function logout(accessToken: string) {
  return unwrap<null>(http.post('/auth/logout', null, { headers: { Authorization: `Bearer ${accessToken}` } }));
}

export function getMe() {
  return unwrap<AuthUser>(http.get('/auth/me'));
}

export function updateMe(data: { name?: string; phone?: string }) {
  return unwrap<AuthUser>(http.patch('/auth/me', data));
}

// Đổi mật khẩu xong server thu hồi mọi phiên cũ và cấp cặp token mới.
export function changePassword(data: { currentPassword: string; newPassword: string }) {
  return unwrap<Session>(http.post('/auth/change-password', data));
}
