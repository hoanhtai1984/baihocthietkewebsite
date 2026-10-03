import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcryptjs';

// Prisma được giả lập hoàn toàn: test route/middleware không cần DB thật
// (nhanh, chạy được trên CI, không đụng dữ liệu Neon).
const prismaMock = vi.hoisted(() => ({
  $queryRaw: vi.fn(),
  $transaction: vi.fn(),
  category: { findMany: vi.fn() },
  product: { findMany: vi.fn(), count: vi.fn(), findUnique: vi.fn() },
  user: { findUnique: vi.fn(), update: vi.fn(), updateMany: vi.fn(), create: vi.fn() },
  order: { findMany: vi.fn(), count: vi.fn(), findFirst: vi.fn() },
}));

vi.mock('../src/lib/prisma', () => ({ prisma: prismaMock }));

import app from '../src/app';
import { signAccessToken } from '../src/utils/jwt';

const customerToken = () => `Bearer ${signAccessToken({ id: 1, role: 'CUSTOMER' })}`;
const adminToken = () => `Bearer ${signAccessToken({ id: 2, role: 'ADMIN' })}`;

beforeEach(() => {
  vi.clearAllMocks();
});

describe('health', () => {
  it('trả 200 khi DB sống', async () => {
    prismaMock.$queryRaw.mockResolvedValue([{ '?column?': 1 }]);
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ status: 'ok', database: 'connected' });
  });
  it('trả 503 khi DB chết', async () => {
    prismaMock.$queryRaw.mockRejectedValue(new Error('down'));
    const res = await request(app).get('/api/v1/health');
    expect(res.status).toBe(503);
    expect(res.body.status).toBe('unhealthy');
  });
});

describe('định dạng phản hồi', () => {
  it('thành công: { success, data }', async () => {
    prismaMock.category.findMany.mockResolvedValue([{ id: 1, slug: 'tu-lanh', name: 'Tủ Lạnh', icon: null, position: 0 }]);
    const res = await request(app).get('/api/v1/categories');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ success: true, data: [{ slug: 'tu-lanh' }] });
  });
  it('vẫn hỗ trợ tiền tố /api cũ', async () => {
    prismaMock.category.findMany.mockResolvedValue([]);
    expect((await request(app).get('/api/categories')).status).toBe(200);
  });
  it('route không tồn tại: 404 dạng lỗi chuẩn', async () => {
    const res = await request(app).get('/api/v1/khong-co');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
  it('JSON hỏng: 400', async () => {
    const res = await request(app).post('/api/v1/auth/login').set('Content-Type', 'application/json').send('{bad');
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
  it('lỗi không lường trước: 500 chung chung, không lộ chi tiết', async () => {
    prismaMock.category.findMany.mockRejectedValue(new Error('secret db detail'));
    const res = await request(app).get('/api/v1/categories');
    expect(res.status).toBe(500);
    expect(JSON.stringify(res.body)).not.toContain('secret db detail');
  });
});

describe('sản phẩm: phân trang', () => {
  it('trả meta phân trang', async () => {
    prismaMock.$transaction.mockResolvedValue([25, [{ id: 1, name: 'A' }]]);
    const res = await request(app).get('/api/v1/products?page=2&limit=10');
    expect(res.status).toBe(200);
    expect(res.body.meta).toEqual({ total: 25, page: 2, limit: 10, totalPages: 3, hasNext: true, hasPrev: true });
  });
  it('limit quá lớn bị từ chối 400', async () => {
    expect((await request(app).get('/api/v1/products?limit=500')).status).toBe(400);
  });
  it('sort không hợp lệ bị từ chối 400', async () => {
    expect((await request(app).get('/api/v1/products?sort=hack')).status).toBe(400);
  });
});

describe('xác thực', () => {
  it('đăng nhập sai mật khẩu: 401 và không lộ email có tồn tại hay không', async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: 1, name: 'A', email: 'a@b.co', password: await bcrypt.hash('dung-mk', 4), role: 'CUSTOMER', phone: null,
    });
    const wrong = await request(app).post('/api/v1/auth/login').send({ email: 'a@b.co', password: 'sai-mk' });
    prismaMock.user.findUnique.mockResolvedValue(null);
    const missing = await request(app).post('/api/v1/auth/login').send({ email: 'khong@co.com', password: 'sai-mk' });
    expect(wrong.status).toBe(401);
    expect(missing.status).toBe(401);
    expect(wrong.body.message).toBe(missing.body.message);
  });
  it('đăng nhập đúng: trả token, KHÔNG trả password/refreshTokenHash', async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: 1, name: 'A', email: 'a@b.co', password: await bcrypt.hash('dung-mk', 4), role: 'CUSTOMER', phone: null, refreshTokenHash: 'x',
    });
    prismaMock.user.update.mockResolvedValue({});
    const res = await request(app).post('/api/v1/auth/login').send({ email: 'A@B.co', password: 'dung-mk' });
    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeTruthy();
    expect(res.body.data.refreshToken).toBeTruthy();
    expect(res.body.data.user).not.toHaveProperty('password');
    expect(res.body.data.user).not.toHaveProperty('refreshTokenHash');
  });
  it('đăng ký với dữ liệu sai: 400', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({ name: 'A', email: 'khong-phai-email', password: '123' });
    expect(res.status).toBe(400);
    expect(res.body.errors).toBeInstanceOf(Array);
  });
  it('refresh token rác: 401', async () => {
    expect((await request(app).post('/api/v1/auth/refresh').send({ refreshToken: 'rac' })).status).toBe(401);
  });
  it('refresh với token đã bị xoay vòng (hash không khớp): 401', async () => {
    const { signRefreshToken } = await import('../src/utils/jwt');
    prismaMock.user.findUnique.mockResolvedValue({ id: 1, role: 'CUSTOMER', refreshTokenHash: 'hash-khac' });
    const res = await request(app).post('/api/v1/auth/refresh').send({ refreshToken: signRefreshToken({ id: 1, role: 'CUSTOMER' }) });
    expect(res.status).toBe(401);
  });
  it('/auth/me không token: 401', async () => {
    expect((await request(app).get('/api/v1/auth/me')).status).toBe(401);
  });
});

describe('phân quyền', () => {
  it('khách vào API admin: 403', async () => {
    const res = await request(app).get('/api/v1/admin/products').set('Authorization', customerToken());
    expect(res.status).toBe(403);
  });
  it('chưa đăng nhập vào API admin: 401', async () => {
    expect((await request(app).get('/api/v1/admin/orders')).status).toBe(401);
    expect((await request(app).get('/api/v1/admin/stats')).status).toBe(401);
  });
  it('admin xem danh sách đơn: có meta', async () => {
    prismaMock.$transaction.mockResolvedValue([0, []]);
    const res = await request(app).get('/api/v1/admin/orders').set('Authorization', adminToken());
    expect(res.status).toBe(200);
    expect(res.body.meta).toMatchObject({ total: 0, page: 1 });
  });
  it('đơn của tôi cần đăng nhập', async () => {
    expect((await request(app).get('/api/v1/orders/me')).status).toBe(401);
  });
});

describe('đặt hàng: kiểm tra đầu vào', () => {
  const valid = { items: [{ productId: 1, quantity: 1 }], guestName: 'A', guestPhone: '0912345678', guestAddress: '1 Test' };
  it('thiếu thông tin người nhận: 400', async () => {
    const res = await request(app).post('/api/v1/orders').send({ items: valid.items });
    expect(res.status).toBe(400);
  });
  it('SĐT sai: 400', async () => {
    expect((await request(app).post('/api/v1/orders').send({ ...valid, guestPhone: '123' })).status).toBe(400);
  });
  it('số lượng 0: 400', async () => {
    expect((await request(app).post('/api/v1/orders').send({ ...valid, items: [{ productId: 1, quantity: 0 }] })).status).toBe(400);
  });
  it('tra cứu đơn thiếu SĐT: 400', async () => {
    expect((await request(app).get('/api/v1/orders/lookup?code=DH000001')).status).toBe(400);
  });
});

describe('gợi ý AI: kiểm tra đầu vào', () => {
  it('câu hỏi rỗng: 400', async () => {
    expect((await request(app).post('/api/v1/ai/suggest').send({ query: '' })).status).toBe(400);
  });
});
