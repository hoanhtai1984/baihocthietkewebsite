import { useState } from 'react';
import { lookupOrder } from '../api/orders';
import { formatMoney } from '../utils/format';
import { STATUS_BADGE, STATUS_LABEL } from '../utils/orderStatus';
import { apiErrorMessage } from '../utils/toast';
import type { Order } from '../types';
import useDocumentTitle from '../hooks/useDocumentTitle';

function OrderLookup() {
  useDocumentTitle('Tra cứu đơn hàng');
  const [code, setCode] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [order, setOrder] = useState<Order | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setOrder(null);
    if (!code.trim() || !phone.trim()) {
      setError('Vui lòng nhập mã đơn và số điện thoại');
      return;
    }
    setLoading(true);
    try {
      setOrder(await lookupOrder(code.trim(), phone.trim()));
    } catch (err) {
      setError(apiErrorMessage(err, 'Không tra cứu được, thử lại sau'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container py-5" style={{ maxWidth: 640 }}>
      <h1 className="fw-bold fs-3 mb-1">Tra cứu đơn hàng</h1>
      <p className="text-muted">Nhập mã đơn (vd DH000012) và số điện thoại đã dùng khi đặt hàng.</p>

      <form className="border rounded-3 p-3 mb-4" onSubmit={handleSubmit}>
        <input className="form-control mb-2" placeholder="Mã đơn hàng" value={code} onChange={(e) => setCode(e.target.value)} />
        <input className="form-control mb-3" type="tel" placeholder="Số điện thoại" value={phone} onChange={(e) => setPhone(e.target.value)} />
        {error && <p className="text-danger small">{error}</p>}
        <button type="submit" className="btn btn-warning fw-bold w-100" disabled={loading}>
          {loading ? 'Đang tra cứu...' : 'Tra cứu'}
        </button>
      </form>

      {order && (
        <div className="border rounded-3 p-3">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <span className="fw-bold">Đơn {order.code}</span>
            <span className={`badge ${STATUS_BADGE[order.status]}`}>{STATUS_LABEL[order.status]}</span>
          </div>
          <p className="text-muted small mb-2">Ngày đặt: {new Date(order.createdAt).toLocaleString('vi-VN')}</p>
          <p className="small mb-2">
            Người nhận: <strong>{order.guestName}</strong> - {order.guestPhone}<br />
            Địa chỉ: {order.guestAddress}
          </p>
          <ul className="list-unstyled mb-2 small">
            {order.items.map((item) => (
              <li key={item.id}>{item.name} x{item.quantity} - {formatMoney(item.price * item.quantity)}</li>
            ))}
          </ul>
          <div className="text-end fw-bold text-danger">Tổng: {formatMoney(order.totalAmount)}</div>
        </div>
      )}
    </div>
  );
}

export default OrderLookup;
