export const STATUS_LABEL: Record<string, string> = {
  PENDING: 'Chờ xác nhận',
  CONFIRMED: 'Đã xác nhận',
  SHIPPED: 'Đang giao',
  COMPLETED: 'Hoàn thành',
  CANCELLED: 'Đã huỷ',
};

export const STATUS_BADGE: Record<string, string> = {
  PENDING: 'bg-secondary',
  CONFIRMED: 'bg-info',
  SHIPPED: 'bg-primary',
  COMPLETED: 'bg-success',
  CANCELLED: 'bg-danger',
};

// Phải khớp ALLOWED_TRANSITIONS ở server (server/src/utils/orderFlow.ts) - chỉ
// để ẩn các lựa chọn không hợp lệ trên giao diện, server vẫn kiểm tra lại.
export const NEXT_STATUSES: Record<string, string[]> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['COMPLETED'],
  COMPLETED: [],
  CANCELLED: [],
};
