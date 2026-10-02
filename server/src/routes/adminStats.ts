import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { requireAdmin } from '../middleware/auth';

const router = Router();
router.use(requireAdmin);

const LOW_STOCK_THRESHOLD = 5;

// Số liệu tổng quan cho trang quản trị: đơn theo trạng thái, doanh thu (chỉ
// tính đơn không bị huỷ), sản phẩm sắp hết hàng, đơn mới nhất.
router.get('/', async (_req, res, next) => {
  try {
    const [byStatus, revenue, productCount, customerCount, lowStock, recentOrders] = await Promise.all([
      prisma.order.groupBy({ by: ['status'], _count: { _all: true } }),
      prisma.order.aggregate({ where: { status: { not: 'CANCELLED' } }, _sum: { totalAmount: true } }),
      prisma.product.count(),
      prisma.user.count({ where: { role: 'CUSTOMER' } }),
      prisma.product.findMany({
        where: { stock: { lte: LOW_STOCK_THRESHOLD } },
        select: { id: true, name: true, stock: true, hidden: true },
        orderBy: { stock: 'asc' },
        take: 10,
      }),
      prisma.order.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { id: true, code: true, status: true, totalAmount: true, createdAt: true, guestName: true, user: { select: { name: true } } },
      }),
    ]);

    const orders: Record<string, number> = { PENDING: 0, CONFIRMED: 0, SHIPPED: 0, COMPLETED: 0, CANCELLED: 0 };
    for (const row of byStatus) orders[row.status] = row._count._all;

    res.json({
      orders,
      totalOrders: Object.values(orders).reduce((a, b) => a + b, 0),
      revenue: revenue._sum.totalAmount || 0,
      productCount,
      customerCount,
      lowStockThreshold: LOW_STOCK_THRESHOLD,
      lowStock,
      recentOrders,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
