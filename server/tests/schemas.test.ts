import { describe, it, expect } from 'vitest';
import { registerSchema, changePasswordSchema } from '../src/schemas/auth';
import { createOrderSchema } from '../src/schemas/order';
import { productQuerySchema, createProductSchema } from '../src/schemas/product';

const opts = { abortEarly: false, stripUnknown: true } as const;

describe('registerSchema', () => {
  it('chuẩn hoá email và bỏ field lạ (chặn mass assignment)', async () => {
    const out = await registerSchema.validate(
      { name: ' An ', email: ' AN@Example.COM ', password: 'abc123', role: 'ADMIN' },
      opts,
    );
    expect(out.email).toBe('an@example.com');
    expect(out.name).toBe('An');
    expect(out).not.toHaveProperty('role');
  });
  it('từ chối mật khẩu ngắn và SĐT sai', async () => {
    await expect(registerSchema.validate({ name: 'A', email: 'a@b.co', password: '123' }, opts)).rejects.toThrow();
    await expect(registerSchema.validate({ name: 'A', email: 'a@b.co', password: '123456', phone: 'abc' }, opts)).rejects.toThrow();
  });
  it('chấp nhận SĐT có dấu cách/chấm', async () => {
    const out = await registerSchema.validate({ name: 'A', email: 'a@b.co', password: '123456', phone: '0912 345.678' }, opts);
    expect(out.phone).toBe('0912345678');
  });
});

describe('changePasswordSchema', () => {
  it('mật khẩu mới tối thiểu 6 ký tự', async () => {
    await expect(changePasswordSchema.validate({ currentPassword: 'x', newPassword: '12345' }, opts)).rejects.toThrow();
  });
});

describe('createOrderSchema', () => {
  const base = { items: [{ productId: 1, quantity: 2 }], guestName: 'A', guestPhone: '0912345678', guestAddress: '1 Test' };
  it('đơn hợp lệ', async () => {
    await expect(createOrderSchema.validate(base, opts)).resolves.toBeTruthy();
  });
  it('bắt buộc thông tin người nhận', async () => {
    await expect(createOrderSchema.validate({ ...base, guestAddress: '' }, opts)).rejects.toThrow();
    await expect(createOrderSchema.validate({ ...base, guestPhone: '123' }, opts)).rejects.toThrow();
  });
  it('số lượng phải từ 1 đến 99 và giỏ không rỗng', async () => {
    await expect(createOrderSchema.validate({ ...base, items: [{ productId: 1, quantity: 0 }] }, opts)).rejects.toThrow();
    await expect(createOrderSchema.validate({ ...base, items: [{ productId: 1, quantity: 100 }] }, opts)).rejects.toThrow();
    await expect(createOrderSchema.validate({ ...base, items: [] }, opts)).rejects.toThrow();
  });
  it('bỏ field giá do khách tự gửi', async () => {
    const out = await createOrderSchema.validate({ ...base, totalAmount: 1, items: [{ productId: 1, quantity: 1, price: 1 }] }, opts);
    expect(out).not.toHaveProperty('totalAmount');
    expect(out.items[0]).not.toHaveProperty('price');
  });
});

describe('productQuerySchema', () => {
  it('mặc định sort newest và chặn limit > 50', async () => {
    expect((await productQuerySchema.validate({}, opts)).sort).toBe('newest');
    await expect(productQuerySchema.validate({ limit: 500 }, opts)).rejects.toThrow();
    await expect(productQuerySchema.validate({ sort: 'hack' }, opts)).rejects.toThrow();
  });
});

describe('createProductSchema', () => {
  const base = { name: 'SP', brand: 'B', image: 'https://x/y.png', description: 'd', price: 1000, categoryId: 1 };
  it('làm sạch specs: bỏ cặp rỗng', async () => {
    const out = await createProductSchema.validate({ ...base, specs: { Màu: 'Đen', '': 'x', Rỗng: '' } }, opts);
    expect(out.specs).toEqual({ Màu: 'Đen' });
  });
  it('từ chối giá âm hoặc bằng 0', async () => {
    await expect(createProductSchema.validate({ ...base, price: -5 }, opts)).rejects.toThrow();
  });
});
