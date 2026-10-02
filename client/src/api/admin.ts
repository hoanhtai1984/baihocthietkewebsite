import http from './http';

// Stats
export function adminGetStats() {
  return http.get('/admin/stats').then((r) => r.data);
}

// Products
export function adminGetProducts() {
  return http.get('/admin/products').then((r) => r.data);
}
export function adminCreateProduct(data: any) {
  return http.post('/admin/products', data).then((r) => r.data);
}
export function adminUpdateProduct(id: number, data: any) {
  return http.patch(`/admin/products/${id}`, data).then((r) => r.data);
}
export function adminDeleteProduct(id: number) {
  return http.delete(`/admin/products/${id}`).then((r) => r.data);
}

// Categories
export function adminGetCategories() {
  return http.get('/admin/categories').then((r) => r.data);
}
export function adminCreateCategory(data: any) {
  return http.post('/admin/categories', data).then((r) => r.data);
}
export function adminUpdateCategory(id: number, data: any) {
  return http.patch(`/admin/categories/${id}`, data).then((r) => r.data);
}
export function adminDeleteCategory(id: number) {
  return http.delete(`/admin/categories/${id}`).then((r) => r.data);
}

// Orders
export function adminGetOrders(status?: string) {
  return http.get('/admin/orders', { params: status ? { status } : undefined }).then((r) => r.data);
}
export function adminUpdateOrderStatus(id: number, status: string) {
  return http.patch(`/admin/orders/${id}/status`, { status }).then((r) => r.data);
}
