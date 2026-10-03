import http, { unwrap } from './http';
import type { Order } from '../types';

export function createOrder(data: {
  items: Array<{ productId: number; quantity: number }>;
  guestName: string;
  guestPhone: string;
  guestAddress: string;
}) {
  return unwrap<Order>(http.post('/orders', data));
}

export function getMyOrders() {
  return unwrap<Order[]>(http.get('/orders/me'));
}

export function cancelMyOrder(id: number) {
  return unwrap<Order>(http.patch(`/orders/${id}/cancel`));
}

export function lookupOrder(code: string, phone: string) {
  return unwrap<Order>(http.get('/orders/lookup', { params: { code, phone } }));
}
