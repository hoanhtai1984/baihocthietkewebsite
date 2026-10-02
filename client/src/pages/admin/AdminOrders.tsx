import { Fragment, useEffect, useState } from 'react';
import { adminGetOrders, adminUpdateOrderStatus } from '../../api/admin';
import { formatMoney } from '../../utils/format';
import { STATUS_BADGE, STATUS_LABEL, NEXT_STATUSES } from '../../utils/orderStatus';
import { showToast, apiErrorMessage } from '../../utils/toast';
import useDocumentTitle from '../../hooks/useDocumentTitle';

function AdminOrders() {
  useDocumentTitle('Quản lý đơn hàng');
  const [orders, setOrders] = useState<any[]>([]);
  const [filterStatus, setFilterStatus] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  // Tải lại mỗi khi đổi bộ lọc trạng thái (lọc ở server)
  useEffect(() => {
    let cancelled = false;
    adminGetOrders(filterStatus || undefined)
      .then((data) => {
        if (cancelled) return;
        setOrders(data);
        setLoadError('');
      })
      .catch((err) => {
        if (!cancelled) setLoadError(apiErrorMessage(err, 'Không tải được đơn hàng'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [filterStatus]);

  async function handleStatusChange(order: any, status: string) {
    const label = STATUS_LABEL[status];
    const warning = status === 'CANCELLED' ? ' Tồn kho của các sản phẩm trong đơn sẽ được hoàn lại và KHÔNG thể mở lại đơn.' : '';
    if (!confirm(`Chuyển đơn ${order.code} sang "${label}"?${warning}`)) return;
    try {
      const updated = await adminUpdateOrderStatus(order.id, status);
      setOrders((list) => list.map((o) => (o.id === order.id ? { ...o, status: updated.status } : o)));
      showToast(`Đơn ${order.code}: ${label}`);
    } catch (err) {
      showToast(apiErrorMessage(err, 'Không đổi được trạng thái'), 'error');
    }
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1 className="fw-bold fs-4 mb-0">Đơn hàng</h1>
        <select
          className="form-select form-select-sm"
          style={{ width: 'auto' }}
          value={filterStatus}
          onChange={(e) => { setLoading(true); setFilterStatus(e.target.value); }}
          aria-label="Lọc theo trạng thái"
        >
          <option value="">Mọi trạng thái</option>
          {Object.entries(STATUS_LABEL).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <p className="text-muted">Đang tải...</p>
      ) : loadError ? (
        <p className="text-danger">{loadError}</p>
      ) : (
        <div className="table-responsive">
          <table className="table align-middle">
            <thead>
              <tr>
                <th></th>
                <th>Mã đơn</th>
                <th>Người nhận</th>
                <th>Ngày đặt</th>
                <th>Tổng tiền</th>
                <th>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 && (
                <tr><td colSpan={6} className="text-center text-muted py-4">Không có đơn hàng nào.</td></tr>
              )}
              {orders.map((o) => {
                const next = NEXT_STATUSES[o.status] || [];
                const expanded = expandedId === o.id;
                return (
                  <Fragment key={o.id}>
                    <tr>
                      <td>
                        <button className="btn btn-sm btn-link p-0" onClick={() => setExpandedId(expanded ? null : o.id)} aria-label="Xem chi tiết">
                          <i className={`bi ${expanded ? 'bi-chevron-down' : 'bi-chevron-right'}`}></i>
                        </button>
                      </td>
                      <td className="fw-bold">{o.code}</td>
                      <td>
                        {o.guestName || o.user?.name}
                        <div className="text-muted small">{o.user ? `Tài khoản: ${o.user.email}` : 'Khách vãng lai'}</div>
                      </td>
                      <td>{new Date(o.createdAt).toLocaleString('vi-VN')}</td>
                      <td>{formatMoney(o.totalAmount)}</td>
                      <td style={{ minWidth: 170 }}>
                        {next.length === 0 ? (
                          <span className={`badge ${STATUS_BADGE[o.status]}`}>{STATUS_LABEL[o.status]}</span>
                        ) : (
                          <select
                            className="form-select form-select-sm"
                            value={o.status}
                            onChange={(e) => handleStatusChange(o, e.target.value)}
                          >
                            <option value={o.status}>{STATUS_LABEL[o.status]}</option>
                            {next.map((s) => (
                              <option key={s} value={s}>→ {STATUS_LABEL[s]}</option>
                            ))}
                          </select>
                        )}
                      </td>
                    </tr>
                    {expanded && (
                      <tr className="table-light">
                        <td></td>
                        <td colSpan={5}>
                          <div className="small mb-2">
                            <strong>Giao đến:</strong> {o.guestName || o.user?.name} - {o.guestPhone || o.user?.phone || '(chưa có SĐT)'}<br />
                            <strong>Địa chỉ:</strong> {o.guestAddress || '(chưa có địa chỉ)'}
                          </div>
                          <ul className="list-unstyled small mb-0">
                            {o.items.map((item: any) => (
                              <li key={item.id}>{item.name} × {item.quantity} - {formatMoney(item.price * item.quantity)}</li>
                            ))}
                          </ul>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default AdminOrders;
