import { Router } from 'express';
import { OrderStatus } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { requireAdmin } from '../middleware/auth';
import { HttpError } from '../utils/httpError';
import { ALLOWED_TRANSITIONS, cancelOrderAndRestock } from '../utils/orderFlow';
import { toInt } from '../utils/validate';

const router = Router();
router.use(requireAdmin);

const VALID_STATUSES = Object.keys(ALLOWED_TRANSITIONS) as OrderStatus[];

router.get('/', async (req, res, next) => {
  try {
    const status = String(req.query.status || '');
    const orders = await prisma.order.findMany({
      where: VALID_STATUSES.includes(status as OrderStatus) ? { status: status as OrderStatus } : undefined,
      include: { items: true, user: { select: { id: true, name: true, email: true, phone: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(orders);
  } catch (err) {
    next(err);
  }
});

router.patch('/:id/status', async (req, res, next) => {
  try {
    const id = toInt(req.params.id, 'Mã đơn', { min: 1 });
    const { status } = req.body || {};
    if (!VALID_STATUSES.includes(status)) {
      throw new HttpError(400, 'Trạng thái không hợp lệ');
    }
    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) throw new HttpError(404, 'Không tìm thấy đơn hàng');
    if (order.status === status) return res.json(order);
    if (!ALLOWED_TRANSITIONS[order.status as OrderStatus].includes(status)) {
      throw new HttpError(400, 'Không thể chuyển đơn từ trạng thái hiện tại sang trạng thái này');
    }

    // Huỷ đơn phải hoàn lại tồn kho - đi qua cùng hàm với khách tự huỷ.
    const updated =
      status === 'CANCELLED'
        ? await prisma.$transaction((tx) => cancelOrderAndRestock(tx, id), { timeout: 15000, maxWait: 10000 })
        : await prisma.order.update({ where: { id }, data: { status }, include: { items: true } });
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

export default router;
