import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import { AppError } from '../utils/appError';

type Role = 'CUSTOMER' | 'ADMIN';

// Đọc Bearer token nếu có, KHÔNG bắt buộc đăng nhập - dùng cho route vừa
// cho khách vãng lai vừa cho khách đã login (vd checkout).
export function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) {
    try {
      req.user = verifyAccessToken(header.slice(7));
    } catch {
      // token hết hạn/sai - coi như khách vãng lai, không chặn request
    }
  }
  next();
}

// Bước 1 - xác thực: "bạn là ai?" -> 401 nếu chưa đăng nhập / token hỏng.
export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return next(new AppError(401, 'Chưa đăng nhập'));
  }
  try {
    req.user = verifyAccessToken(header.slice(7));
    next();
  } catch {
    next(new AppError(401, 'Token không hợp lệ hoặc đã hết hạn'));
  }
}

// Bước 2 - phân quyền: "bạn được làm gì?" -> 403 nếu sai vai trò. Luôn đặt SAU
// requireAuth (thứ tự middleware quan trọng).
export function authorize(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new AppError(403, 'Không có quyền truy cập'));
    }
    next();
  };
}

export const requireAdmin = [requireAuth, authorize('ADMIN')];
