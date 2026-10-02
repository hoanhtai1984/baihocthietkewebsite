import { HttpError } from './httpError';

export function toInt(value: unknown, field: string, { min = 0, max = 2_000_000_000 } = {}) {
  const n = Number(value);
  if (!Number.isInteger(n) || n < min || n > max) {
    throw new HttpError(400, `${field} không hợp lệ (số nguyên từ ${min} đến ${max})`);
  }
  return n;
}

export function requireText(value: unknown, field: string, maxLength = 255) {
  const text = typeof value === 'string' ? value.trim() : '';
  if (!text) throw new HttpError(400, `Thiếu ${field}`);
  if (text.length > maxLength) throw new HttpError(400, `${field} quá dài (tối đa ${maxLength} ký tự)`);
  return text;
}

// SĐT Việt Nam: 0xxxxxxxxx hoặc +84xxxxxxxxx (9-10 số sau đầu số).
export function isValidPhone(phone: string) {
  return /^(0|\+84)\d{9,10}$/.test(phone.replace(/[\s.-]/g, ''));
}

export function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
