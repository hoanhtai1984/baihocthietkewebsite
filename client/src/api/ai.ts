import http from './http';

export function suggestProducts(query: string) {
  return http.post('/ai/suggest', { query }).then((r) => r.data);
}
