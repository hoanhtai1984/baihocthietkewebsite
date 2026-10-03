import type { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { AppError } from '../utils/appError';
import { logger } from '../lib/logger';

interface ParserError extends Error {
  type?: string;
}

// Đổi MỌI lỗi thành phản hồi { success:false, message, errors? } tiếng Việt.
// Lỗi không lường trước (500) chỉ trả câu chung chung - chi tiết (stack, SQL,
// đường dẫn file) chỉ ghi vào log phía server, không bao giờ gửi cho client.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      ...(err.details && { errors: err.details }),
    });
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2025') return res.status(404).json({ success: false, message: 'Không tìm thấy dữ liệu' });
    if (err.code === 'P2002') return res.status(409).json({ success: false, message: 'Dữ liệu bị trùng (đã tồn tại)' });
    if (err.code === 'P2003') {
      return res.status(409).json({ success: false, message: 'Dữ liệu đang được sử dụng ở nơi khác nên không thể thực hiện' });
    }
  }

  const parserError = err as ParserError;
  if (parserError?.type === 'entity.parse.failed') {
    return res.status(400).json({ success: false, message: 'Dữ liệu gửi lên không phải JSON hợp lệ' });
  }
  if (parserError?.type === 'entity.too.large') {
    return res.status(413).json({ success: false, message: 'Dữ liệu gửi lên quá lớn' });
  }

  logger.error({ err: parserError?.message, name: parserError?.name, path: req.path }, 'Unhandled error');
  res.status(500).json({ success: false, message: 'Lỗi máy chủ, vui lòng thử lại sau' });
}

export function notFoundHandler(_req: Request, res: Response) {
  res.status(404).json({ success: false, message: 'Không tìm thấy route' });
}
