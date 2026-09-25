import { CART_UPDATED_EVENT } from '../hooks/useCartCount';

const STORAGE_KEY = 'dmnk_mini_cart_v1';

export interface CartItem {
  id: number;
  slug: string;
  name: string;
  brand: string;
  price: number;
  image: string;
  qty: number;
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

function saveCart(cart: CartItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
  window.dispatchEvent(new Event(CART_UPDATED_EVENT));
}

export function addItem(product: any, qty = 1) {
  const cart = getCart();
  const existing = cart.find((item) => item.id === product.id);
  if (existing) {
    existing.qty += qty;
  } else {
    cart.push({
      id: product.id,
      slug: product.slug,
      name: product.name,
      brand: product.brand,
      price: product.price,
      image: product.image,
      qty,
    });
  }
  saveCart(cart);
  return cart;
}

export function removeItem(id: number) {
  const cart = getCart().filter((item) => item.id !== id);
  saveCart(cart);
  return cart;
}

export function updateQty(id: number, qty: number) {
  const cart = getCart();
  const item = cart.find((item) => item.id === id);
  if (item) item.qty = Math.max(1, Math.min(99, qty));
  saveCart(cart);
  return cart;
}

export function clearCart() {
  saveCart([]);
}
