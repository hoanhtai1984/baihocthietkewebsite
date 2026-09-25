import http from './http';

export function getProducts(params?: { category?: string; search?: string }) {
  return http.get('/products', { params }).then((r) => r.data);
}

export function getProduct(slug: string) {
  return http.get(`/products/${slug}`).then((r) => r.data);
}
