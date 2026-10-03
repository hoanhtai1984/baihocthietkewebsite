import http, { unwrap, unwrapList } from './http';
import type { AdminStats, Category, Order, OrderStatus, Product } from '../types';

export interface ProductInput {
  name: string;
  brand: string;
  image: string;
  description: string;
  price: number;
  oldPrice: number | null;
  stock: number;
  categoryId: number;
  hidden?: boolean;
  specs: Record<string, string> | null;
}

export interface CategoryInput {
  name: string;
  icon?: string | null;
  position?: number;
}

export interface AdminProductFilters {
  search?: string;
  categoryId?: number;
  status?: 'active' | 'hidden' | 'low';
  page?: number;
  limit?: number;
}

// Stats
export function adminGetStats() {
  return unwrap<AdminStats>(http.get('/admin/stats'));
}

// Products
export function adminGetProducts(params?: AdminProductFilters) {
  return unwrapList<Product>(http.get('/admin/products', { params }));
}
export function adminCreateProduct(data: ProductInput) {
  return unwrap<Product>(http.post('/admin/products', data));
}
export function adminUpdateProduct(id: number, data: Partial<ProductInput>) {
  return unwrap<Product>(http.patch(`/admin/products/${id}`, data));
}
export async function adminDeleteProduct(id: number) {
  await http.delete(`/admin/products/${id}`);
}

// Categories
export function adminGetCategories() {
  return unwrap<Category[]>(http.get('/admin/categories'));
}
export function adminCreateCategory(data: CategoryInput) {
  return unwrap<Category>(http.post('/admin/categories', data));
}
export function adminUpdateCategory(id: number, data: Partial<CategoryInput>) {
  return unwrap<Category>(http.patch(`/admin/categories/${id}`, data));
}
export async function adminDeleteCategory(id: number) {
  await http.delete(`/admin/categories/${id}`);
}

// Orders
export function adminGetOrders(params?: { status?: OrderStatus; page?: number; limit?: number }) {
  return unwrapList<Order>(http.get('/admin/orders', { params }));
}
export function adminUpdateOrderStatus(id: number, status: OrderStatus) {
  return unwrap<Order>(http.patch(`/admin/orders/${id}/status`, { status }));
}
