import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminGetStats } from '../../api/admin';
import { formatMoney } from '../../utils/format';
import { STATUS_BADGE, STATUS_LABEL } from '../../utils/orderStatus';
import { apiErrorMessage } from '../../utils/toast';
import type { AdminStats } from '../../types';
import useDocumentTitle from '../../hooks/useDocumentTitle';

function StatCard({ icon, label, value, to, tone }: { icon: string; label: string; value: string | number; to?: string; tone: string }) {
  const body = (
    <div className="border rounded-3 p-3 h-100 d-flex align-items-center gap-3 bg-white">
      <i className={`bi ${icon} fs-1 text-${tone}`}></i>
      <div>
        <div className="text-muted small">{label}</div>
        <div className="fw-bold fs-4">{value}</div>
      </div>
    </div>
  );
  return to ? <Link to={to} className="text-decoration-none text-dark">{body}</Link> : body;
}

function AdminDashboard() {
  useDocumentTitle('Tổng quan quản trị');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    adminGetStats()
      .then(setStats)
      .catch((err) => setError(apiErrorMessage(err, 'Không tải được số liệu')));
  }, []);

  if (error) return <p className="text-danger">{error}</p>;
  if (!stats) return <p className="text-muted">Đang tải...</p>;

  return (
    <div>
      <h1 className="fw-bold fs-4 mb-3">Tổng quan</h1>

      <div className="row g-3 mb-4">
        <div className="col-6 col-lg-3">
          <StatCard icon="bi-cash-coin" label="Doanh thu (không tính đơn huỷ)" value={formatMoney(stats.revenue)} tone="success" />
        </div>
        <div className="col-6 col-lg-3">
          <StatCard icon="bi-receipt" label="Tổng số đơn" value={stats.totalOrders} to="/admin/don-hang" tone="primary" />
        </div>
        <div className="col-6 col-lg-3">
          <StatCard icon="bi-hourglass-split" label="Đơn chờ xác nhận" value={stats.orders.PENDING} to="/admin/don-hang" tone="warning" />
        </div>
        <div className="col-6 col-lg-3">
          <StatCard icon="bi-people" label="Khách hàng" value={stats.customerCount} tone="info" />
        </div>
        <div className="col-6 col-lg-3">
          <StatCard icon="bi-box-seam" label="Sản phẩm" value={stats.productCount} to="/admin/san-pham" tone="secondary" />
        </div>
        <div className="col-6 col-lg-3">
          <StatCard icon="bi-truck" label="Đang giao" value={stats.orders.SHIPPED} to="/admin/don-hang" tone="primary" />
        </div>
        <div className="col-6 col-lg-3">
          <StatCard icon="bi-check2-circle" label="Hoàn thành" value={stats.orders.COMPLETED} tone="success" />
        </div>
        <div className="col-6 col-lg-3">
          <StatCard icon="bi-x-circle" label="Đã huỷ" value={stats.orders.CANCELLED} tone="danger" />
        </div>
      </div>

      <div className="row g-4">
        <div className="col-lg-6">
          <h2 className="fw-bold fs-5 mb-2">Đơn hàng mới nhất</h2>
          {stats.recentOrders.length === 0 ? (
            <p className="text-muted">Chưa có đơn hàng nào.</p>
          ) : (
            <table className="table table-sm align-middle">
              <tbody>
                {stats.recentOrders.map((o) => (
                  <tr key={o.id}>
                    <td className="fw-bold">{o.code}</td>
                    <td>{o.guestName || o.user?.name}</td>
                    <td>{formatMoney(o.totalAmount)}</td>
                    <td><span className={`badge ${STATUS_BADGE[o.status]}`}>{STATUS_LABEL[o.status]}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="col-lg-6">
          <h2 className="fw-bold fs-5 mb-2">Sắp hết hàng (≤ {stats.lowStockThreshold})</h2>
          {stats.lowStock.length === 0 ? (
            <p className="text-muted">Tất cả sản phẩm còn đủ hàng.</p>
          ) : (
            <table className="table table-sm align-middle">
              <tbody>
                {stats.lowStock.map((p) => (
                  <tr key={p.id}>
                    <td>{p.name} {p.hidden && <span className="badge bg-secondary">Đã ẩn</span>}</td>
                    <td className="text-end">
                      <span className={`badge ${p.stock === 0 ? 'bg-danger' : 'bg-warning text-dark'}`}>
                        {p.stock === 0 ? 'Hết hàng' : `Còn ${p.stock}`}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
