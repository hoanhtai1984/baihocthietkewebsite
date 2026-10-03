import { useEffect, useState } from 'react';
import { getCart } from '../utils/cart';

export const CART_UPDATED_EVENT = 'cart:updated';

// Bắt đầu bằng 0 (không đọc localStorage ngay lúc render đầu) để tránh
// nhấp nháy/không khớp nếu sau này có SSR - cập nhật giá trị thật trong
// useEffect (chạy sau khi mount, chỉ trên trình duyệt).
function useCartCount() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    function update() {
      const cart = getCart();
      setCount(cart.reduce((sum: number, item) => sum + item.qty, 0));
    }
    update();
    window.addEventListener(CART_UPDATED_EVENT, update);
    window.addEventListener('storage', update);
    return () => {
      window.removeEventListener(CART_UPDATED_EVENT, update);
      window.removeEventListener('storage', update);
    };
  }, []);

  return count;
}

export default useCartCount;
