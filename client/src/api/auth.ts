import http from './http';

export function register(data: { name: string; email: string; password: string; phone?: string }) {
  return http.post('/auth/register', data).then((r) => r.data);
}

export function login(data: { email: string; password: string }) {
  return http.post('/auth/login', data).then((r) => r.data);
}
