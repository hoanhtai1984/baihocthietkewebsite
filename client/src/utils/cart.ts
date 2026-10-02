import { CART_UPDATED_EVENT } from '../hooks/useCartCount';

const STORAGE_KEY = 'dmnk_mini_cart_v1';
const MAX_QTY = 99;

export interface CartItem {
  id: number;
  slug: string;
  name: string;
  brand: string;
  price: number;
  image: string;
  qty: number;
  // Tồn kho tại lần cập nhật gần nhất - dùng để chặn số lượng vượt tồn ngay trên giao diện.
  stock?: number;
}

export function getCart(): CartItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveCart(cart: CartItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
  window.dispatchEvent(new Event(CART_UPDATED_EVENT));
}

export interface AddResult {
  // Số lượng thực tế đã thêm (có thể ít hơn yêu cầu nếu chạm giới hạn tồn kho).
  added: number;
  capped: boolean;
  limit: number;
}

// Thêm vào giỏ nhưng KHÔNG vượt tồn kho (và tối đa 99/sản phẩm).
export function addItem(product: any, qty = 1): AddResult {
  const cart = getCart();
  const limit = Math.min(MAX_QTY, Math.max(0, Number(product.stock ?? MAX_QTY)));
  const existing = cart.find((item) => item.id === product.id);
  const current = existing ? existing.qty : 0;
  const target = Math.min(limit, current + qty);
  const added = target - current;

  if (existing) {
    existing.qty = target;
    existing.price = product.price;
    existing.stock = product.stock;
  } else if (target > 0) {
    cart.push({
      id: product.id,
      slug: product.slug,
      name: product.name,
      brand: product.brand,
      price: product.price,
      image: product.image,
      qty: target,
      stock: product.stock,
    });
  }
  saveCart(cart);
  return { added, capped: added < qty, limit };
}

export function removeItem(id: number) {
  const cart = getCart().filter((item) => item.id !== id);
  saveCart(cart);
  return cart;
}

export function updateQty(id: number, qty: number) {
  const cart = getCart();
  const item = cart.find((item) => item.id === id);
  if (item) {
    const limit = Math.min(MAX_QTY, item.stock ?? MAX_QTY);
    item.qty = Math.max(1, Math.min(limit, qty));
  }
  saveCart(cart);
  return cart;
}

export function clearCart() {
  saveCart([]);
}
