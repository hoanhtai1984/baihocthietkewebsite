import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { optionalAuth, requireAuth } from '../middleware/auth';
import { buildOrderCode } from '../utils/orderCode';
import { logger } from '../lib/logger';

const router = Router();

router.post('/', optionalAuth, async (req, res, next) => {
  try {
    const { items, guestName, guestPhone, guestAddress } = req.body || {};
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Giỏ hàng trống' });
    }
    if (!req.user && (!guestName || !guestPhone || !guestAddress)) {
      return res.status(400).json({ message: 'Khách vãng lai cần nhập đủ tên, SĐT, địa chỉ' });
    }

    const productIds = items.map((i: any) => Number(i.productId));
    const products = await prisma.product.findMany({ where: { id: { in: productIds } } });
    const productMap = new Map(products.map((p) => [p.id, p]));

    let totalAmount = 0;
    const orderItemsData: any[] = [];
    for (const item of items) {
      const product = productMap.get(Number(item.productId));
      const quantity = Number(item.quantity) || 0;
      if (!product || quantity <= 0) {
        return res.status(400).json({ message: 'Sản phẩm trong giỏ không hợp lệ' });
      }
      if (product.stock < quantity) {
        return res.status(400).json({ message: `"${product.name}" không đủ hàng (còn ${product.stock})` });
      }
      totalAmount += product.price * quantity;
      orderItemsData.push({
        productId: product.id,
        name: product.name,
        price: product.price,
        quantity,
      });
    }

    const order = await prisma.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          code: 'TEMP',
          userId: req.user?.id,
          guestName: req.user ? null : guestName,
          guestPhone: req.user ? null : guestPhone,
          guestAddress: req.user ? null : guestAddress,
          totalAmount,
          items: { create: orderItemsData },
        },
        include: { items: true },
      });
      for (const item of orderItemsData) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });
      }
      return tx.order.update({
        where: { id: created.id },
        data: { code: buildOrderCode(created.id) },
        include: { items: true },
      });
    }, {
      // Mặc định Prisma chỉ cho 5s/giao dịch - đủ với DB local nhưng Neon
      // (Postgres serverless, "ngủ" khi không ai gọi trong 1 khoảng thời
      // gian) có độ trễ round-trip cao hơn hẳn, đặc biệt lần gọi ĐẦU sau
      // lúc rảnh (cold start) - từng gặp lỗi thật "Transaction already
      // closed" khi checkout. Nới rộng để chịu được cold start + vài vòng
      // lặp cập nhật tồn kho.
      timeout: 15000,
      maxWait: 10000,
    });

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

export default router;
