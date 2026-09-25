import { useEffect, useState } from 'react';
import { getMyOrders } from '../api/orders';
import { formatMoney } from '../utils/format';

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'Chờ xác nhận',
  CONFIRMED: 'Đã xác nhận',
  SHIPPED: 'Đang giao',
  COMPLETED: 'Hoàn thành',
  CANCELLED: 'Đã huỷ',
};

const STATUS_BADGE: Record<string, string> = {
  PENDING: 'bg-secondary',
  CONFIRMED: 'bg-info',
  SHIPPED: 'bg-primary',
  COMPLETED: 'bg-success',
  CANCELLED: 'bg-danger',
};

function MyOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyOrders()
      .then(setOrders)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="container py-5 text-center text-muted">Đang tải...</div>;
  }

  if (orders.length === 0) {
    return (
      <div className="container py-5 text-center">
        <i className="bi bi-receipt fs-1 text-muted d-block mb-3"></i>
        <h1 className="fw-bold fs-4">Bạn chưa có đơn hàng nào</h1>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <h1 className="fw-bold fs-3 mb-4">Đơn hàng của tôi</h1>
      {orders.map((order) => (
        <div key={order.id} className="border rounded-3 p-3 mb-3">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <span className="fw-bold">Đơn {order.code}</span>
            <span className={`badge ${STATUS_BADGE[order.status]}`}>{STATUS_LABEL[order.status]}</span>
          </div>
          <p className="text-muted small mb-2">
            Ngày đặt: {new Date(order.createdAt).toLocaleString('vi-VN')}
          </p>
          <ul className="list-unstyled mb-2 small">
            {order.items.map((item: any) => (
              <li key={item.id}>
                {item.name} x{item.quantity} - {formatMoney(item.price * item.quantity)}
              </li>
            ))}
          </ul>
          <div className="text-end fw-bold text-danger">Tổng: {formatMoney(order.totalAmount)}</div>
        </div>
      ))}
    </div>
  );
}

export default MyOrders;
