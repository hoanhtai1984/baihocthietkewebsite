import { Prisma, OrderStatus } from '@prisma/client';
import { AppError } from './appError';

// Luồng trạng thái hợp lệ của đơn hàng. HUỶ chỉ được khi chưa giao đi; đơn
// đã huỷ/hoàn thành là trạng thái cuối (không mở lại, tránh phải trừ kho lần 2).
export const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['COMPLETED'],
  COMPLETED: [],
  CANCELLED: [],
};

// Huỷ đơn + hoàn lại tồn kho cho từng sản phẩm, chạy TRONG transaction của
// người gọi để 2 việc này luôn đi cùng nhau (không có chuyện huỷ mà quên hoàn kho).
export async function cancelOrderAndRestock(tx: Prisma.TransactionClient, orderId: number) {
  const order = await tx.order.findUnique({ where: { id: orderId }, include: { items: true } });
  if (!order) throw new AppError(404, 'Không tìm thấy đơn hàng');
  if (!ALLOWED_TRANSITIONS[order.status].includes('CANCELLED')) {
    throw new AppError(400, 'Đơn hàng ở trạng thái này không thể huỷ');
  }
  for (const item of order.items) {
    await tx.product.update({
      where: { id: item.productId },
      data: { stock: { increment: item.quantity } },
    });
  }
  return tx.order.update({
    where: { id: orderId },
    data: { status: 'CANCELLED' },
    include: { items: true },
  });
}
