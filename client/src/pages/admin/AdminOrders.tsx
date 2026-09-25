import { useEffect, useState } from 'react';
import { adminGetOrders, adminUpdateOrderStatus } from '../../api/admin';
import { formatMoney } from '../../utils/format';

const STATUSES = ['PENDING', 'CONFIRMED', 'SHIPPED', 'COMPLETED', 'CANCELLED'];
const STATUS_LABEL: Record<string, string> = {
  PENDING: 'Chờ xác nhận',
  CONFIRMED: 'Đã xác nhận',
  SHIPPED: 'Đang giao',
  COMPLETED: 'Hoàn thành',
  CANCELLED: 'Đã huỷ',
};

function AdminOrders() {
  const [orders, setOrders] = useState<any[]>([]);

  function load() {
    adminGetOrders().then(setOrders);
  }

  useEffect(load, []);

  async function handleStatusChange(id: number, status: string) {
    await adminUpdateOrderStatus(id, status);
    load();
  }

  return (
    <div>
      <h1 className="fw-bold fs-4 mb-3">Đơn hàng</h1>
      <div className="table-responsive">
        <table className="table align-middle">
          <thead>
            <tr>
              <th>Mã đơn</th>
              <th>Khách hàng</th>
              <th>Ngày đặt</th>
              <th>Tổng tiền</th>
              <th>Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id}>
                <td className="fw-bold">{o.code}</td>
                <td>{o.user ? `${o.user.name} (${o.user.email})` : `${o.guestName} (khách vãng lai)`}</td>
                <td>{new Date(o.createdAt).toLocaleString('vi-VN')}</td>
                <td>{formatMoney(o.totalAmount)}</td>
                <td>
                  <select
                    className="form-select form-select-sm"
                    value={o.status}
                    onChange={(e) => handleStatusChange(o.id, e.target.value)}
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>{STATUS_LABEL[s]}</option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AdminOrders;
