import { describe, it, expect } from 'vitest';
import { normalizeText } from '../src/utils/text';
import { slugify } from '../src/utils/slugify';
import { buildOrderCode } from '../src/utils/orderCode';
import { buildMeta, parsePagination } from '../src/utils/pagination';
import { ALLOWED_TRANSITIONS } from '../src/utils/orderFlow';
import { AppError } from '../src/utils/appError';
import { hashToken, signAccessToken, signRefreshToken, verifyAccessToken, verifyRefreshToken } from '../src/utils/jwt';
import { keywordSuggest, parseBudget } from '../src/utils/suggest';

describe('normalizeText / slugify', () => {
  it('bỏ dấu tiếng Việt và về chữ thường', () => {
    expect(normalizeText('Điều Hòa Đẹp')).toBe('dieu hoa dep');
  });
  it('slugify tạo slug an toàn cho URL', () => {
    expect(slugify('  Tủ Lạnh Side-by-Side 500L!  ')).toBe('tu-lanh-side-by-side-500l');
    expect(slugify('Đồ gia dụng')).toBe('do-gia-dung');
    expect(slugify('!!!')).toBe('');
  });
});

describe('buildOrderCode', () => {
  it('đệm số 0 đủ 6 chữ số', () => {
    expect(buildOrderCode(7)).toBe('DH000007');
    expect(buildOrderCode(123456)).toBe('DH123456');
  });
});

describe('phân trang', () => {
  it('mặc định page 1, limit 12', () => {
    expect(parsePagination({})).toEqual({ page: 1, limit: 12, skip: 0 });
  });
  it('chặn page/limit sai và giới hạn limit tối đa', () => {
    expect(parsePagination({ page: '-3', limit: 'abc' })).toEqual({ page: 1, limit: 12, skip: 0 });
    expect(parsePagination({ page: '3', limit: '1000' })).toEqual({ page: 3, limit: 50, skip: 100 });
    expect(parsePagination({ page: 2 }, { defaultLimit: 10, maxLimit: 100 })).toEqual({ page: 2, limit: 10, skip: 10 });
  });
  it('buildMeta tính tổng trang và hasNext/hasPrev', () => {
    expect(buildMeta(25, 2, 10)).toEqual({ total: 25, page: 2, limit: 10, totalPages: 3, hasNext: true, hasPrev: true });
    expect(buildMeta(0, 1, 10)).toMatchObject({ totalPages: 1, hasNext: false, hasPrev: false });
    expect(buildMeta(30, 3, 10)).toMatchObject({ hasNext: false, hasPrev: true });
  });
});

describe('luồng trạng thái đơn hàng', () => {
  it('đơn đã huỷ/hoàn thành là trạng thái cuối', () => {
    expect(ALLOWED_TRANSITIONS.CANCELLED).toEqual([]);
    expect(ALLOWED_TRANSITIONS.COMPLETED).toEqual([]);
  });
  it('không nhảy cóc từ PENDING sang COMPLETED', () => {
    expect(ALLOWED_TRANSITIONS.PENDING).not.toContain('COMPLETED');
    expect(ALLOWED_TRANSITIONS.PENDING).toContain('CONFIRMED');
    expect(ALLOWED_TRANSITIONS.SHIPPED).toEqual(['COMPLETED']);
  });
});

describe('AppError', () => {
  it('mang statusCode, message và details', () => {
    const err = new AppError(400, 'Sai', [{ field: 'a', message: 'x' }]);
    expect(err).toBeInstanceOf(Error);
    expect(err.statusCode).toBe(400);
    expect(err.details).toEqual([{ field: 'a', message: 'x' }]);
  });
});

describe('JWT', () => {
  it('ký và xác thực access token', () => {
    const token = signAccessToken({ id: 5, role: 'ADMIN' });
    expect(verifyAccessToken(token)).toMatchObject({ id: 5, role: 'ADMIN' });
  });
  it('access token không xác thực được bằng secret của refresh token', () => {
    expect(() => verifyRefreshToken(signAccessToken({ id: 1, role: 'CUSTOMER' }))).toThrow();
  });
  it('2 refresh token tạo liên tiếp luôn khác nhau (phục vụ xoay vòng)', () => {
    const a = signRefreshToken({ id: 1, role: 'CUSTOMER' });
    const b = signRefreshToken({ id: 1, role: 'CUSTOMER' });
    expect(a).not.toBe(b);
    expect(hashToken(a)).not.toBe(hashToken(b));
    expect(hashToken(a)).toHaveLength(64);
  });
  it('token sai bị từ chối', () => {
    expect(() => verifyAccessToken('rac')).toThrow();
  });
});

describe('gợi ý theo từ khoá', () => {
  it('parseBudget hiểu "dưới 10 triệu"', () => {
    expect(parseBudget('tủ lạnh dưới 10 triệu')).toMatchObject({ max: 10_000_000 });
  });
  it('keywordSuggest lọc theo ngân sách', () => {
    const products = [
      { id: 1, name: 'Tủ lạnh A', brand: 'LG', price: 8_000_000, stock: 5, category: { name: 'Tủ Lạnh' } },
      { id: 2, name: 'Tủ lạnh B', brand: 'LG', price: 20_000_000, stock: 5, category: { name: 'Tủ Lạnh' } },
    ];
    const result = keywordSuggest('tủ lạnh dưới 10 triệu', products as never);
    expect(result.map((r) => r.product.id)).toEqual([1]);
  });
});
