import { OrderStatus, Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { logger } from '../lib/logger';
import { AppError } from '../utils/appError';
import { buildOrderCode } from '../utils/orderCode';
import { ALLOWED_TRANSITIONS, cancelOrderAndRestock } from '../utils/orderFlow';
import { buildMeta, parsePagination } from '../utils/pagination';

// Mặc định Prisma chỉ cho 5s/giao dịch - Neon (Postgres serverless) có độ trễ
// cao nhất là lần gọi đầu sau lúc "ngủ" (cold start), từng gặp lỗi thật
// "Transaction already closed" khi checkout nên nới rộng thời gian.
const TX_OPTIONS = { timeout: 15000, maxWait: 10000 };

export interface CreateOrderInput {
  items: Array<{ productId: number; quantity: number }>;
  guestName: string;
  guestPhone: string;
  guestAddress: string;
}

const stripPhone = (phone: string) => phone.replace(/[\s.-]/g, '');

// Đặt hàng: kiểm tra + trừ tồn kho + tạo đơn + tạo dòng đơn trong CÙNG 1 transaction.
// Giá/tên lấy từ DB (không tin client) và được chụp lại (snapshot) vào dòng đơn.
export async function createOrder(input: CreateOrderInput, userId?: number) {
  // Gộp các dòng trùng sản phẩm (cộng dồn số lượng) - nếu không, 2 dòng cùng sản
  // phẩm sẽ qua mặt bước kiểm tra tồn kho của từng dòng riêng lẻ.
  const quantities = new Map<number, number>();
  for (const item of input.items) {
    quantities.set(item.productId, (quantities.get(item.productId) || 0) + item.quantity);
  }

  const order = await prisma.$transaction(async (tx) => {
    const products = await tx.product.findMany({ where: { id: { in: [...quantities.keys()] } } });
    const productMap = new Map(products.map((p) => [p.id, p]));

    let totalAmount = 0;
    const items: Array<{ productId: number; name: string; price: number; quantity: number }> = [];
    for (const [productId, quantity] of quantities) {
      const product = productMap.get(productId);
      if (!product || product.hidden) {
        throw new AppError(400, 'Có sản phẩm trong giỏ không còn được bán, vui lòng tải lại giỏ hàng');
      }
      // Trừ kho theo điều kiện (stock >= quantity) NGAY trong câu UPDATE: nếu 2
      // khách mua cùng lúc món cuối cùng thì chỉ 1 người trừ được, người kia
      // nhận lỗi "không đủ hàng" - tồn kho không bao giờ âm.
      const updated = await tx.product.updateMany({
        where: { id: productId, stock: { gte: quantity } },
        data: { stock: { decrement: quantity } },
      });
      if (updated.count === 0) {
        const fresh = await tx.product.findUnique({ where: { id: productId }, select: { stock: true } });
        throw new AppError(409, `"${product.name}" không đủ hàng (còn ${fresh?.stock ?? 0})`);
      }
      totalAmount += product.price * quantity;
      items.push({ productId, name: product.name, price: product.price, quantity });
    }

    const created = await tx.order.create({
      data: {
        code: `TEMP-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        userId,
        guestName: input.guestName,
        guestPhone: input.guestPhone,
        guestAddress: input.guestAddress,
        totalAmount,
        items: { create: items },
      },
    });
    return tx.order.update({
      where: { id: created.id },
      data: { code: buildOrderCode(created.id) },
      include: { items: true },
    });
  }, TX_OPTIONS);

  logger.info({ orderId: order.id, userId }, 'Order created');
  return order;
}

export function listMyOrders(userId: number) {
  return prisma.order.findMany({
    where: { userId },
    include: { items: true },
    orderBy: { createdAt: 'desc' },
  });
}

// Khách vãng lai tra cứu đơn bằng mã đơn + SĐT đã dùng lúc đặt.
export async function lookupOrder(code: string, phone: string) {
  const order = await prisma.order.findUnique({
    where: { code },
    include: { items: true, user: { select: { phone: true } } },
  });
  const orderPhone = stripPhone(order?.guestPhone || order?.user?.phone || '');
  // Cùng 1 thông báo cho "sai mã" và "sai SĐT" để không lộ mã đơn nào tồn tại.
  if (!order || !orderPhone || orderPhone !== stripPhone(phone)) {
    throw new AppError(404, 'Không tìm thấy đơn hàng khớp mã đơn và số điện thoại này');
  }
  const { user: _user, ...publicOrder } = order;
  return publicOrder;
}

// Khách tự huỷ đơn của mình khi đơn còn "Chờ xác nhận" - hoàn lại tồn kho.
export async function cancelMyOrder(userId: number, orderId: number) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  // Không phải đơn của mình -> báo 404 (không lộ sự tồn tại của đơn người khác)
  if (!order || order.userId !== userId) throw new AppError(404, 'Không tìm thấy đơn hàng');
  if (order.status !== 'PENDING') {
    throw new AppError(400, 'Chỉ huỷ được đơn đang ở trạng thái "Chờ xác nhận"');
  }
  const cancelled = await prisma.$transaction((tx) => cancelOrderAndRestock(tx, orderId), TX_OPTIONS);
  logger.info({ orderId, userId }, 'Order cancelled by customer');
  return cancelled;
}

// ---------- Quản trị ----------

export async function adminListOrders(query: { status?: OrderStatus; page?: number; limit?: number }) {
  const { page, limit, skip } = parsePagination(query, { defaultLimit: 10, maxLimit: 100 });
  const where: Prisma.OrderWhereInput = query.status ? { status: query.status } : {};
  const [total, orders] = await prisma.$transaction([
    prisma.order.count({ where }),
    prisma.order.findMany({
      where,
      include: { items: true, user: { select: { id: true, name: true, email: true, phone: true } } },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
  ]);
  return { orders, meta: buildMeta(total, page, limit) };
}

export async function adminUpdateOrderStatus(id: number, status: OrderStatus) {
  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) throw new AppError(404, 'Không tìm thấy đơn hàng');
  if (order.status === status) return order;
  if (!ALLOWED_TRANSITIONS[order.status].includes(status)) {
    throw new AppError(400, 'Không thể chuyển đơn từ trạng thái hiện tại sang trạng thái này');
  }
  // Huỷ đơn phải hoàn lại tồn kho - đi qua cùng hàm với khách tự huỷ.
  if (status === 'CANCELLED') {
    return prisma.$transaction((tx) => cancelOrderAndRestock(tx, id), TX_OPTIONS);
  }
  return prisma.order.update({ where: { id }, data: { status }, include: { items: true } });
}
