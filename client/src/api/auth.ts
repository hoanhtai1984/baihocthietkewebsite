import http from './http';

export function register(data: { name: string; email: string; password: string; phone?: string }) {
  return http.post('/auth/register', data).then((r) => r.data);
}

export function login(data: { email: string; password: string }) {
  return http.post('/auth/login', data).then((r) => r.data);
}

export function getMe() {
  return http.get('/auth/me').then((r) => r.data);
}

export function updateMe(data: { name?: string; phone?: string }) {
  return http.patch('/auth/me', data).then((r) => r.data);
}

export function changePassword(data: { currentPassword: string; newPassword: string }) {
  return http.post('/auth/change-password', data).then((r) => r.data);
}
