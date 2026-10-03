import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Prisma } from '@prisma/client';

const tx = vi.hoisted(() => ({
  product: { findMany: vi.fn(), updateMany: vi.fn(), findUnique: vi.fn(), update: vi.fn() },
  order: { create: vi.fn(), update: vi.fn(), findUnique: vi.fn() },
}));

const prismaMock = vi.hoisted(() => ({
  $transaction: vi.fn(),
  order: { findUnique: vi.fn(), update: vi.fn(), findMany: vi.fn(), count: vi.fn() },
  product: { findMany: vi.fn(), count: vi.fn(), findUnique: vi.fn() },
  user: { findUnique: vi.fn(), update: vi.fn(), updateMany: vi.fn() },
}));

vi.mock('../src/lib/prisma', () => ({ prisma: prismaMock }));

import * as orderService from '../src/services/orderService';
import * as productService from '../src/services/productService';
import * as authService from '../src/services/authService';
import { cancelOrderAndRestock } from '../src/utils/orderFlow';
import { AppError } from '../src/utils/appError';
import { hashToken, signRefreshToken } from '../src/utils/jwt';

const input = { items: [{ productId: 1, quantity: 2 }], guestName: 'A', guestPhone: '0912345678', guestAddress: '1 Test' };
const product = { id: 1, name: 'Tủ lạnh', price: 1000, stock: 5, hidden: false };

beforeEach(() => {
  vi.clearAllMocks();
  // $transaction chạy callback với tx giả; dạng mảng (count + findMany) trả kết quả đã đặt sẵn
  prismaMock.$transaction.mockImplementation(async (arg: unknown) =>
    typeof arg === 'function' ? (arg as (t: unknown) => unknown)(tx) : arg,
  );
});

describe('orderService.createOrder', () => {
  it('trừ kho, lấy giá từ DB (không tin client) và tạo mã đơn', async () => {
    tx.product.findMany.mockResolvedValue([product]);
    tx.product.updateMany.mockResolvedValue({ count: 1 });
    tx.order.create.mockResolvedValue({ id: 12 });
    tx.order.update.mockImplementation(async ({ data }: { data: { code: string } }) => ({ id: 12, ...data, items: [] }));

    const order = await orderService.createOrder(input, 7);

    expect(order.code).toBe('DH000012');
    expect(tx.product.updateMany).toHaveBeenCalledWith({
      where: { id: 1, stock: { gte: 2 } },
      data: { stock: { decrement: 2 } },
    });
    const created = tx.order.create.mock.calls[0][0].data;
    expect(created.totalAmount).toBe(2000);
    expect(created.userId).toBe(7);
    expect(created.items.create[0]).toMatchObject({ productId: 1, price: 1000, quantity: 2 });
  });

  it('gộp 2 dòng cùng sản phẩm trước khi trừ kho', async () => {
    tx.product.findMany.mockResolvedValue([product]);
    tx.product.updateMany.mockResolvedValue({ count: 1 });
    tx.order.create.mockResolvedValue({ id: 1 });
    tx.order.update.mockResolvedValue({ id: 1, items: [] });

    await orderService.createOrder({ ...input, items: [{ productId: 1, quantity: 1 }, { productId: 1, quantity: 3 }] });

    expect(tx.product.updateMany).toHaveBeenCalledTimes(1);
    expect(tx.product.updateMany.mock.calls[0][0].data).toEqual({ stock: { decrement: 4 } });
  });

  it('không đủ hàng: 409 và không tạo đơn', async () => {
    tx.product.findMany.mockResolvedValue([product]);
    tx.product.updateMany.mockResolvedValue({ count: 0 });
    tx.product.findUnique.mockResolvedValue({ stock: 1 });

    await expect(orderService.createOrder(input)).rejects.toMatchObject({ statusCode: 409 });
    expect(tx.order.create).not.toHaveBeenCalled();
  });

  it('sản phẩm đã ẩn hoặc không tồn tại: 400', async () => {
    tx.product.findMany.mockResolvedValue([{ ...product, hidden: true }]);
    await expect(orderService.createOrder(input)).rejects.toMatchObject({ statusCode: 400 });
    tx.product.findMany.mockResolvedValue([]);
    await expect(orderService.createOrder(input)).rejects.toMatchObject({ statusCode: 400 });
  });
});

describe('orderService: tra cứu / huỷ / đổi trạng thái', () => {
  it('lookupOrder khớp mã + SĐT (bỏ qua dấu cách) và không lộ user', async () => {
    prismaMock.order.findUnique.mockResolvedValue({ id: 1, code: 'DH000001', guestPhone: '0912345678', user: null, items: [] });
    const order = await orderService.lookupOrder('DH000001', '0912 345 678');
    expect(order.code).toBe('DH000001');
    expect(order).not.toHaveProperty('user');
  });

  it('lookupOrder sai SĐT hoặc sai mã: cùng 1 lỗi 404', async () => {
    prismaMock.order.findUnique.mockResolvedValue({ id: 1, guestPhone: '0912345678', user: null, items: [] });
    await expect(orderService.lookupOrder('DH000001', '0900000000')).rejects.toMatchObject({ statusCode: 404 });
    prismaMock.order.findUnique.mockResolvedValue(null);
    await expect(orderService.lookupOrder('DH999999', '0912345678')).rejects.toMatchObject({ statusCode: 404 });
  });

  it('khách không huỷ được đơn của người khác (IDOR): 404', async () => {
    prismaMock.order.findUnique.mockResolvedValue({ id: 5, userId: 99, status: 'PENDING' });
    await expect(orderService.cancelMyOrder(1, 5)).rejects.toMatchObject({ statusCode: 404 });
  });

  it('chỉ huỷ được đơn đang chờ xác nhận', async () => {
    prismaMock.order.findUnique.mockResolvedValue({ id: 5, userId: 1, status: 'SHIPPED' });
    await expect(orderService.cancelMyOrder(1, 5)).rejects.toMatchObject({ statusCode: 400 });
  });

  it('huỷ đơn hợp lệ hoàn lại tồn kho', async () => {
    prismaMock.order.findUnique.mockResolvedValue({ id: 5, userId: 1, status: 'PENDING' });
    tx.order.findUnique.mockResolvedValue({ id: 5, status: 'PENDING', items: [{ productId: 1, quantity: 2 }, { productId: 2, quantity: 1 }] });
    tx.order.update.mockResolvedValue({ id: 5, status: 'CANCELLED', items: [] });

    const result = await orderService.cancelMyOrder(1, 5);

    expect(result.status).toBe('CANCELLED');
    expect(tx.product.update).toHaveBeenCalledWith({ where: { id: 1 }, data: { stock: { increment: 2 } } });
    expect(tx.product.update).toHaveBeenCalledWith({ where: { id: 2 }, data: { stock: { increment: 1 } } });
  });

  it('cancelOrderAndRestock từ chối đơn đã hoàn thành', async () => {
    tx.order.findUnique.mockResolvedValue({ id: 1, status: 'COMPLETED', items: [] });
    await expect(cancelOrderAndRestock(tx as unknown as Prisma.TransactionClient, 1)).rejects.toBeInstanceOf(AppError);
  });

  it('admin: không nhảy cóc trạng thái, không mở lại đơn đã huỷ', async () => {
    prismaMock.order.findUnique.mockResolvedValue({ id: 1, status: 'PENDING' });
    await expect(orderService.adminUpdateOrderStatus(1, 'COMPLETED')).rejects.toMatchObject({ statusCode: 400 });
    prismaMock.order.findUnique.mockResolvedValue({ id: 1, status: 'CANCELLED' });
    await expect(orderService.adminUpdateOrderStatus(1, 'PENDING')).rejects.toMatchObject({ statusCode: 400 });
  });

  it('admin: đơn không tồn tại 404; chuyển hợp lệ thì cập nhật', async () => {
    prismaMock.order.findUnique.mockResolvedValue(null);
    await expect(orderService.adminUpdateOrderStatus(9, 'CONFIRMED')).rejects.toMatchObject({ statusCode: 404 });
    prismaMock.order.findUnique.mockResolvedValue({ id: 1, status: 'PENDING' });
    prismaMock.order.update.mockResolvedValue({ id: 1, status: 'CONFIRMED' });
    expect(await orderService.adminUpdateOrderStatus(1, 'CONFIRMED')).toMatchObject({ status: 'CONFIRMED' });
  });

  it('admin: danh sách đơn có lọc trạng thái và meta', async () => {
    prismaMock.order.count.mockReturnValue('count');
    prismaMock.order.findMany.mockReturnValue('rows');
    prismaMock.$transaction.mockResolvedValue([23, [{ id: 1 }]]);
    const { orders, meta } = await orderService.adminListOrders({ status: 'PENDING', page: 3, limit: 10 });
    expect(orders).toHaveLength(1);
    expect(meta).toMatchObject({ total: 23, page: 3, totalPages: 3, hasNext: false, hasPrev: true });
    expect(prismaMock.order.count).toHaveBeenCalledWith({ where: { status: 'PENDING' } });
  });
});

describe('productService', () => {
  it('tìm kiếm không dấu rồi mới phân trang', async () => {
    const rows = [
      { id: 1, name: 'Điều Hòa Daikin', brand: 'Daikin' },
      { id: 2, name: 'Tủ Lạnh LG', brand: 'LG' },
      { id: 3, name: 'Máy lạnh điều hòa Casper', brand: 'Casper' },
    ];
    prismaMock.product.findMany.mockResolvedValue(rows);
    const { products, meta } = await productService.listProducts({ search: 'dieu hoa', page: 1, limit: 1 });
    expect(products.map((p) => p.id)).toEqual([1]);
    expect(meta).toMatchObject({ total: 2, totalPages: 2, hasNext: true });
  });

  it('không có từ khoá: phân trang ngay ở DB', async () => {
    prismaMock.$transaction.mockResolvedValue([30, [{ id: 1 }]]);
    const { meta } = await productService.listProducts({ page: 2, limit: 12 });
    expect(meta).toMatchObject({ total: 30, page: 2, totalPages: 3 });
  });

  it('sản phẩm không tồn tại hoặc đã ẩn: 404', async () => {
    prismaMock.product.findUnique.mockResolvedValue(null);
    await expect(productService.getProductBySlug('khong-co')).rejects.toMatchObject({ statusCode: 404 });
    prismaMock.product.findUnique.mockResolvedValue({ id: 1, hidden: true });
    await expect(productService.getProductBySlug('an')).rejects.toMatchObject({ statusCode: 404 });
  });
});

describe('authService.refresh (xoay vòng token)', () => {
  const user = { id: 1, name: 'A', email: 'a@b.co', role: 'CUSTOMER' as const, phone: null };

  it('token còn khớp hash: cấp cặp token mới và lưu hash mới', async () => {
    const old = signRefreshToken({ id: 1, role: 'CUSTOMER' });
    prismaMock.user.findUnique.mockResolvedValue({ ...user, refreshTokenHash: hashToken(old) });
    prismaMock.user.updateMany.mockResolvedValue({ count: 1 });

    const session = await authService.refresh(old);

    expect(session.refreshToken).not.toBe(old);
    expect(prismaMock.user.updateMany).toHaveBeenCalledWith({
      where: { id: 1, refreshTokenHash: hashToken(old) },
      data: { refreshTokenHash: hashToken(session.refreshToken) },
    });
    expect(session.user).not.toHaveProperty('refreshTokenHash');
  });

  it('2 request refresh đồng thời: request chậm hơn bị từ chối', async () => {
    const old = signRefreshToken({ id: 1, role: 'CUSTOMER' });
    prismaMock.user.findUnique.mockResolvedValue({ ...user, refreshTokenHash: hashToken(old) });
    prismaMock.user.updateMany.mockResolvedValue({ count: 0 });
    await expect(authService.refresh(old)).rejects.toMatchObject({ statusCode: 401 });
  });

  it('token đã bị thay (đăng xuất/đổi mật khẩu): 401', async () => {
    const old = signRefreshToken({ id: 1, role: 'CUSTOMER' });
    prismaMock.user.findUnique.mockResolvedValue({ ...user, refreshTokenHash: null });
    await expect(authService.refresh(old)).rejects.toMatchObject({ statusCode: 401 });
  });

  it('logout xoá hash refresh token', async () => {
    prismaMock.user.updateMany.mockResolvedValue({ count: 1 });
    await authService.logout(1);
    expect(prismaMock.user.updateMany).toHaveBeenCalledWith({ where: { id: 1 }, data: { refreshTokenHash: null } });
  });
});
