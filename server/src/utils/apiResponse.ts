import type { Response } from 'express';
import type { PaginationMeta } from './pagination';

interface SuccessOptions {
  status?: number;
  meta?: PaginationMeta;
  message?: string;
}

// Mọi phản hồi thành công có cùng 1 dạng: { success, data, meta?, message? } -
// client luôn đọc res.data.data (xem bài RESTful API Design).
export function sendSuccess<T>(res: Response, data: T, { status = 200, meta, message }: SuccessOptions = {}) {
  return res.status(status).json({
    success: true,
    data,
    ...(meta && { meta }),
    ...(message && { message }),
  });
}
