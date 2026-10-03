import { describe, it, expect, vi } from 'vitest';
import { AxiosError } from 'axios';
import { formatMoney } from './format';
import { addItem, clearCart, getCart, removeItem, updateQty } from './cart';
import { NEXT_STATUSES, STATUS_LABEL } from './orderStatus';
import { clearAuth, getAccessToken, getRefreshToken, getStoredUser, setAuth, setTokens } from './authStorage';
import { apiErrorMessage, apiErrorStatus, showToast } from './toast';

const product = { id: 1, slug: 'tu-lanh', name: 'Tủ lạnh', brand: 'LG', price: 1000, image: 'x.png', stock: 3 };

describe('formatMoney', () => {
  it('định dạng tiền VND', () => {
    expect(formatMoney(1500000)).toBe((1500000).toLocaleString('vi-VN') + 'đ');
  });
  it('null/undefined cho chuỗi rỗng', () => {
    expect(formatMoney(null)).toBe('');
    expect(formatMoney(undefined)).toBe('');
  });
});

describe('giỏ hàng', () => {
  it('thêm mới và cộng dồn số lượng', () => {
    addItem(product, 1);
    addItem(product, 1);
    expect(getCart()).toHaveLength(1);
    expect(getCart()[0].qty).toBe(2);
  });
  it('không vượt tồn kho', () => {
    const result = addItem(product, 10);
    expect(result).toEqual({ added: 3, capped: true, limit: 3 });
    expect(getCart()[0].qty).toBe(3);
    expect(addItem(product, 1).added).toBe(0);
  });
  it('không thêm sản phẩm hết hàng', () => {
    addItem({ ...product, stock: 0 }, 1);
    expect(getCart()).toHaveLength(0);
  });
  it('updateQty giới hạn trong [1, tồn kho]', () => {
    addItem(product, 1);
    expect(updateQty(1, 99)[0].qty).toBe(3);
    expect(updateQty(1, 0)[0].qty).toBe(1);
  });
  it('removeItem / clearCart', () => {
    addItem(product, 1);
    addItem({ ...product, id: 2 }, 1);
    expect(removeItem(1)).toHaveLength(1);
    clearCart();
    expect(getCart()).toEqual([]);
  });
  it('phát sự kiện cập nhật để badge giỏ hàng đổi theo', () => {
    const handler = vi.fn();
    window.addEventListener('cart:updated', handler);
    addItem(product, 1);
    window.removeEventListener('cart:updated', handler);
    expect(handler).toHaveBeenCalled();
  });
  it('dữ liệu giỏ hỏng trong localStorage không làm sập', () => {
    localStorage.setItem('dmnk_mini_cart_v1', '{hong');
    expect(getCart()).toEqual([]);
  });
});

describe('trạng thái đơn hàng', () => {
  it('mọi trạng thái đều có nhãn tiếng Việt', () => {
    for (const status of Object.keys(NEXT_STATUSES)) expect(STATUS_LABEL[status]).toBeTruthy();
  });
  it('đơn đã huỷ / hoàn thành không còn chuyển tiếp', () => {
    expect(NEXT_STATUSES.CANCELLED).toEqual([]);
    expect(NEXT_STATUSES.COMPLETED).toEqual([]);
  });
});

describe('authStorage', () => {
  const user = { id: 1, name: 'A', email: 'a@b.co', role: 'CUSTOMER' as const };
  it('lưu, đọc và xoá phiên', () => {
    setAuth(user, 'acc', 'ref');
    expect(getAccessToken()).toBe('acc');
    expect(getRefreshToken()).toBe('ref');
    expect(getStoredUser()).toEqual(user);
    clearAuth();
    expect(getAccessToken()).toBeNull();
    expect(getStoredUser()).toBeNull();
  });
  it('setTokens ghi đè cả cặp token (refresh token xoay vòng)', () => {
    setAuth(user, 'acc', 'ref');
    setTokens('acc2', 'ref2');
    expect(getAccessToken()).toBe('acc2');
    expect(getRefreshToken()).toBe('ref2');
    expect(getStoredUser()).toEqual(user);
  });
});

describe('toast / lỗi API', () => {
  it('lấy message tiếng Việt từ phản hồi lỗi của API', () => {
    const err = new AxiosError('x', '400', undefined, undefined, {
      status: 400,
      data: { message: 'Giỏ hàng trống' },
    } as never);
    expect(apiErrorMessage(err)).toBe('Giỏ hàng trống');
    expect(apiErrorStatus(err)).toBe(400);
  });
  it('lỗi không phải từ API: dùng câu mặc định', () => {
    expect(apiErrorMessage(new Error('x'), 'Mặc định')).toBe('Mặc định');
    expect(apiErrorStatus(new Error('x'))).toBeUndefined();
  });
  it('showToast hiển thị dạng chữ thô (không chạy HTML - chống XSS)', () => {
    showToast('<img src=x onerror=alert(1)>');
    const toast = document.querySelector('.app-toast span');
    expect(toast?.textContent).toBe('<img src=x onerror=alert(1)>');
    expect(document.querySelector('.app-toast img')).toBeNull();
  });
});
