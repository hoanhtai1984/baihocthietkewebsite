import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getMyOrders, cancelMyOrder } from '../api/orders';
import { formatMoney } from '../utils/format';
import { STATUS_BADGE, STATUS_LABEL } from '../utils/orderStatus';
import { showToast, apiErrorMessage } from '../utils/toast';
import type { Order } from '../types';
import useDocumentTitle from '../hooks/useDocumentTitle';

function MyOrders() {
  useDocumentTitle('Đơn hàng của tôi');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancellingId, setCancellingId] = useState<number | null>(null);

  function load() {
    getMyOrders()
      .then((data) => {
        setOrders(data);
        setError('');
      })
      .catch((err) => setError(apiErrorMessage(err, 'Không tải được đơn hàng')))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function handleCancel(order: Order) {
    if (!confirm(`Huỷ đơn ${order.code}? Hành động này không thể hoàn tác.`)) return;
    setCancellingId(order.id);
    try {
      const updated = await cancelMyOrder(order.id);
      setOrders((list) => list.map((o) => (o.id === order.id ? { ...o, status: updated.status } : o)));
      showToast(`Đã huỷ đơn ${order.code}`);
    } catch (err) {
      showToast(apiErrorMessage(err, 'Không huỷ được đơn hàng'), 'error');
    } finally {
      setCancellingId(null);
    }
  }

  if (loading) {
    return <div className="container py-5 text-center text-muted">Đang tải...</div>;
  }

  if (error) {
    return (
      <div className="container py-5 text-center">
        <p className="text-danger">{error}</p>
        <button className="btn btn-outline-secondary" onClick={() => { setLoading(true); setError(''); load(); }}>Thử lại</button>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="container py-5 text-center">
        <i className="bi bi-receipt fs-1 text-muted d-block mb-3"></i>
        <h1 className="fw-bold fs-4">Bạn chưa có đơn hàng nào</h1>
        <Link to="/danh-muc" className="btn btn-warning fw-bold mt-3">Bắt đầu mua sắm</Link>
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
          <p className="text-muted small mb-1">Ngày đặt: {new Date(order.createdAt).toLocaleString('vi-VN')}</p>
          {order.guestAddress && (
            <p className="text-muted small mb-2">
              Giao đến: {order.guestName} - {order.guestPhone} - {order.guestAddress}
            </p>
          )}
          <ul className="list-unstyled mb-2 small">
            {order.items.map((item) => (
              <li key={item.id}>
                {item.name} x{item.quantity} - {formatMoney(item.price * item.quantity)}
              </li>
            ))}
          </ul>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              {order.status === 'PENDING' && (
                <button className="btn btn-sm btn-outline-danger" disabled={cancellingId === order.id} onClick={() => handleCancel(order)}>
                  {cancellingId === order.id ? 'Đang huỷ...' : 'Huỷ đơn'}
                </button>
              )}
            </div>
            <div className="fw-bold text-danger">Tổng: {formatMoney(order.totalAmount)}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default MyOrders;
