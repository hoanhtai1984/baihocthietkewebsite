import http, { unwrap, unwrapList } from './http';
import type { Product } from '../types';

export interface ProductFilters {
  category?: string;
  search?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: string;
  page?: number;
  limit?: number;
}

export function getProducts(params?: ProductFilters) {
  return unwrapList<Product>(http.get('/products', { params }));
}

export function getBrands(category?: string) {
  return unwrap<string[]>(http.get('/products/brands', { params: { category } }));
}

export function getProduct(slug: string) {
  return unwrap<Product>(http.get(`/products/${slug}`));
}
