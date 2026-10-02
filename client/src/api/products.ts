import http from './http';

export interface ProductFilters {
  category?: string;
  search?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: string;
}

export function getProducts(params?: ProductFilters) {
  return http.get('/products', { params }).then((r) => r.data);
}

export function getBrands(category?: string): Promise<string[]> {
  return http.get('/products/brands', { params: { category } }).then((r) => r.data);
}

export function getProduct(slug: string) {
  return http.get(`/products/${slug}`).then((r) => r.data);
}
