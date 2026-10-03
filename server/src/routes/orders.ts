import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { optionalAuth, requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { sendSuccess } from '../utils/apiResponse';
import { createOrderSchema, lookupOrderSchema } from '../schemas/order';
import { idParamSchema } from '../schemas/common';
import * as orderService from '../services/orderService';

const router = Router();

// Tra cứu đơn của khách vãng lai bằng mã + SĐT - giới hạn để không bị dò mã đơn.
// Tắt khi chạy test (NODE_ENV=test) để các bài test không tự chặn nhau.
const lookupLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test',
  message: { success: false, message: 'Tra cứu quá nhiều lần, vui lòng thử lại sau' },
});

// Đặt hàng - khách vãng lai (không token) hoặc đã đăng nhập đều được.
router.post('/', optionalAuth, validate(createOrderSchema), async (req, res, next) => {
  try {
    const order = await orderService.createOrder(req.body, req.user?.id);
    sendSuccess(res, order, { status: 201, message: 'Đặt hàng thành công' });
  } catch (err) {
    next(err);
  }
});

router.get('/me', requireAuth, async (req, res, next) => {
  try {
    sendSuccess(res, await orderService.listMyOrders(req.user!.id));
  } catch (err) {
    next(err);
  }
});

router.get('/lookup', lookupLimiter, validate(lookupOrderSchema, 'query'), async (_req, res, next) => {
  try {
    const { code, phone } = res.locals.query as { code: string; phone: string };
    sendSuccess(res, await orderService.lookupOrder(code, phone));
  } catch (err) {
    next(err);
  }
});

router.patch('/:id/cancel', requireAuth, validate(idParamSchema, 'params'), async (req, res, next) => {
  try {
    const { id } = res.locals.params as { id: number };
    sendSuccess(res, await orderService.cancelMyOrder(req.user!.id, id), { message: 'Đã huỷ đơn hàng' });
  } catch (err) {
    next(err);
  }
});

export default router;
