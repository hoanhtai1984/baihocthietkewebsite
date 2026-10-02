import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { prisma } from '../lib/prisma';
import { optionalAuth, requireAuth } from '../middleware/auth';
import { buildOrderCode } from '../utils/orderCode';
import { logger } from '../lib/logger';
import { HttpError } from '../utils/httpError';
import { cancelOrderAndRestock } from '../utils/orderFlow';
import { isValidPhone, requireText, toInt } from '../utils/validate';

const router = Router();

// Tra cứu đơn của khách vãng lai bằng mã + SĐT - giới hạn để không bị dò mã đơn.
const lookupLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: true, legacyHeaders: false });

router.post('/', optionalAuth, async (req, res, next) => {
  try {
    const { items } = req.body || {};
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Giỏ hàng trống' });
    }
    if (items.length > 50) {
      return res.status(400).json({ message: 'Giỏ hàng có quá nhiều sản phẩm' });
    }

    // Thông tin người nhận BẮT BUỘC cho mọi đơn (cả khách đã đăng nhập) - nếu
    // không admin sẽ không biết giao đi đâu. Lưu vào các cột guest* (hiểu là
    // "người nhận") dù đơn có gắn tài khoản hay không.
    const name = requireText(req.body?.guestName, 'họ tên người nhận', 100);
    const phone = requireText(req.body?.guestPhone, 'số điện thoại', 20);
    const address = requireText(req.body?.guestAddress, 'địa chỉ giao hàng', 255);
    if (!isValidPhone(phone)) {
      return res.status(400).json({ message: 'Số điện thoại không hợp lệ' });
    }
    const guest = { name, phone, address };

    // Gộp các dòng trùng sản phẩm thành 1 (cộng dồn số lượng) - nếu không, 2
    // dòng cùng sản phẩm sẽ qua mặt bước kiểm tra tồn kho từng dòng riêng lẻ.
    const quantities = new Map<number, number>();
    for (const item of items) {
      const productId = toInt(item?.productId, 'Mã sản phẩm', { min: 1 });
      const quantity = toInt(item?.quantity, 'Số lượng', { min: 1, max: 99 });
      quantities.set(productId, (quantities.get(productId) || 0) + quantity);
    }

    const order = await prisma.$transaction(
      async (tx) => {
        const products = await tx.product.findMany({ where: { id: { in: [...quantities.keys()] } } });
        const productMap = new Map(products.map((p) => [p.id, p]));

        let totalAmount = 0;
        const orderItemsData: Array<{ productId: number; name: string; price: number; quantity: number }> = [];
        for (const [productId, quantity] of quantities) {
          const product = productMap.get(productId);
          if (!product || product.hidden) {
            throw new HttpError(400, 'Có sản phẩm trong giỏ không còn được bán, vui lòng tải lại giỏ hàng');
          }
          // Trừ kho theo điều kiện (stock >= quantity) NGAY trong câu UPDATE: nếu 2
          // khách mua cùng lúc món cuối cùng thì chỉ 1 người trừ được, người kia
          // nhận lỗi "không đủ hàng" - không bao giờ làm tồn kho âm.
          const updated = await tx.product.updateMany({
            where: { id: productId, stock: { gte: quantity } },
            data: { stock: { decrement: quantity } },
          });
          if (updated.count === 0) {
            const fresh = await tx.product.findUnique({ where: { id: productId }, select: { stock: true } });
            throw new HttpError(409, `"${product.name}" không đủ hàng (còn ${fresh?.stock ?? 0})`);
          }
          totalAmount += product.price * quantity;
          orderItemsData.push({ productId, name: product.name, price: product.price, quantity });
        }

        const created = await tx.order.create({
          data: {
            code: `TEMP-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            userId: req.user?.id,
            guestName: guest.name,
            guestPhone: guest.phone,
            guestAddress: guest.address,
            totalAmount,
            items: { create: orderItemsData },
          },
        });
        return tx.order.update({
          where: { id: created.id },
          data: { code: buildOrderCode(created.id) },
          include: { items: true },
        });
      },
      {
        // Mặc định Prisma chỉ cho 5s/giao dịch - Neon (Postgres serverless) có
        // độ trễ cao nhất là lần gọi đầu sau lúc "ngủ" (cold start), từng gặp lỗi
        // thật "Transaction already closed" khi checkout nên nới rộng thời gian.
        timeout: 15000,
        maxWait: 10000,
      },
    );

    logger.info({ orderId: order.id, userId: req.user?.id }, 'Order created');
    res.status(201).json(order);
  } catch (err) {
    next(err);
  }
});

router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const orders = await prisma.order.findMany({
      where: { userId: req.user!.id },
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(orders);
  } catch (err) {
    next(err);
  }
});

// Khách vãng lai tra cứu đơn bằng mã đơn + SĐT đã dùng lúc đặt.
router.get('/lookup', lookupLimiter, async (req, res, next) => {
  try {
    const code = String(req.query.code || '').trim().toUpperCase();
    const phone = String(req.query.phone || '').replace(/[\s.-]/g, '');
    if (!code || !phone) {
      return res.status(400).json({ message: 'Vui lòng nhập mã đơn và số điện thoại' });
    }
    const order = await prisma.order.findUnique({ where: { code }, include: { items: true, user: { select: { phone: true } } } });
    const orderPhone = (order?.guestPhone || order?.user?.phone || '').replace(/[\s.-]/g, '');
    // Cùng 1 thông báo cho "sai mã" và "sai SĐT" để không lộ mã đơn nào tồn tại.
    if (!order || !orderPhone || orderPhone !== phone) {
      return res.status(404).json({ message: 'Không tìm thấy đơn hàng khớp mã đơn và số điện thoại này' });
    }
    const { user: _user, ...rest } = order;
    res.json(rest);
  } catch (err) {
    next(err);
  }
});

// Khách tự huỷ đơn của mình khi đơn còn "Chờ xác nhận" - hoàn lại tồn kho.
router.patch('/:id/cancel', requireAuth, async (req, res, next) => {
  try {
    const id = toInt(req.params.id, 'Mã đơn', { min: 1 });
    const order = await prisma.order.findUnique({ where: { id } });
    if (!order || order.userId !== req.user!.id) {
      return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
    }
    if (order.status !== 'PENDING') {
      return res.status(400).json({ message: 'Chỉ huỷ được đơn đang ở trạng thái "Chờ xác nhận"' });
    }
    const cancelled = await prisma.$transaction((tx) => cancelOrderAndRestock(tx, id), { timeout: 15000, maxWait: 10000 });
    logger.info({ orderId: id, userId: req.user!.id }, 'Order cancelled by customer');
    res.json(cancelled);
  } catch (err) {
    next(err);
  }
});

export default router;
