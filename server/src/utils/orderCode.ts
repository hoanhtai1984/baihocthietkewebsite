// Mã đơn hàng hiển thị cho khách, vd "DH000123" - dựa trên id tự tăng của
// Order, gọi SAU KHI đã tạo record (cần id thật) rồi update lại code.
export function buildOrderCode(id: number) {
  return `DH${String(id).padStart(6, '0')}`;
}
