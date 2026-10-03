import type { Request, Response, NextFunction } from 'express';
import { ValidationError, type Schema } from 'yup';
import { AppError } from '../utils/appError';

type Source = 'body' | 'query' | 'params';

// Kiểm tra + làm sạch dữ liệu đầu vào bằng schema Yup TRƯỚC khi vào service.
// stripUnknown: field không khai báo trong schema bị bỏ hẳn - chặn "mass
// assignment" (khách tự gửi thêm role/price/stock...).
// Body hợp lệ được ghi đè lại vào req.body; query/params hợp lệ để ở
// res.locals.query / res.locals.params (req.query của Express 5 là getter,
// không gán đè được).
export function validate(schema: Schema, source: Source = 'body') {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const cleaned = await schema.validate(req[source], { abortEarly: false, stripUnknown: true });
      if (source === 'body') req.body = cleaned;
      else res.locals[source] = cleaned;
      next();
    } catch (err) {
      if (err instanceof ValidationError) {
        const details = err.inner.length > 0 ? err.inner : [err];
        return next(
          new AppError(
            400,
            details[0].message,
            details.map((e) => ({ field: e.path || '', message: e.message })),
          ),
        );
      }
      next(err);
    }
  };
}
