import { Router } from 'express';
import type { OrderStatus } from '@prisma/client';
import { requireAdmin } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { sendSuccess } from '../utils/apiResponse';
import { idParamSchema } from '../schemas/common';
import { adminOrderQuerySchema, updateOrderStatusSchema } from '../schemas/order';
import * as orderService from '../services/orderService';

const router = Router();
router.use(requireAdmin);

router.get('/', validate(adminOrderQuerySchema, 'query'), async (_req, res, next) => {
  try {
    const { orders, meta } = await orderService.adminListOrders(
      res.locals.query as { status?: OrderStatus; page?: number; limit?: number },
    );
    sendSuccess(res, orders, { meta });
  } catch (err) {
    next(err);
  }
});

router.patch('/:id/status', validate(idParamSchema, 'params'), validate(updateOrderStatusSchema), async (req, res, next) => {
  try {
    const { id } = res.locals.params as { id: number };
    sendSuccess(res, await orderService.adminUpdateOrderStatus(id, req.body.status), { message: 'Đã cập nhật trạng thái đơn' });
  } catch (err) {
    next(err);
  }
});

export default router;
