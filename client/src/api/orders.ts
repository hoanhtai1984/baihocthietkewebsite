import http from './http';

export function createOrder(data: {
  items: Array<{ productId: number; quantity: number }>;
  guestName: string;
  guestPhone: string;
  guestAddress: string;
}) {
  return http.post('/orders', data).then((r) => r.data);
}

export function getMyOrders() {
  return http.get('/orders/me').then((r) => r.data);
}

export function cancelMyOrder(id: number) {
  return http.patch(`/orders/${id}/cancel`).then((r) => r.data);
}

export function lookupOrder(code: string, phone: string) {
  return http.get('/orders/lookup', { params: { code, phone } }).then((r) => r.data);
}
