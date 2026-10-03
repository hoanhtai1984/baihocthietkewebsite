import jwt from 'jsonwebtoken';
import { createHash } from 'node:crypto';

export interface TokenPayload {
  id: number;
  role: 'CUSTOMER' | 'ADMIN';
}

// Đọc secret MỖI LẦN dùng (không chốt lúc import) để test/đổi biến môi trường
// không bị kẹt giá trị cũ.
const accessSecret = () => process.env.JWT_ACCESS_SECRET as string;
const refreshSecret = () => process.env.JWT_REFRESH_SECRET as string;

const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';

export function signAccessToken(payload: TokenPayload) {
  return jwt.sign(payload, accessSecret(), { expiresIn: ACCESS_TOKEN_EXPIRY });
}

// jti ngẫu nhiên để 2 refresh token tạo trong cùng 1 giây vẫn khác nhau
// (cần cho cơ chế xoay vòng refresh token).
export function signRefreshToken(payload: TokenPayload) {
  return jwt.sign(payload, refreshSecret(), { expiresIn: REFRESH_TOKEN_EXPIRY, jwtid: createHash('sha1').update(`${Math.random()}${Date.now()}`).digest('hex') });
}

export function verifyAccessToken(token: string): TokenPayload {
  return jwt.verify(token, accessSecret()) as TokenPayload;
}

export function verifyRefreshToken(token: string): TokenPayload {
  return jwt.verify(token, refreshSecret()) as TokenPayload;
}

// Chỉ lưu BĂM của refresh token trong DB - lộ DB cũng không lộ token dùng được.
export function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}
