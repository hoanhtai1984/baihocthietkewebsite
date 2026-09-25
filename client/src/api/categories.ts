import http from './http';

export function getCategories() {
  return http.get('/categories').then((r) => r.data);
}
