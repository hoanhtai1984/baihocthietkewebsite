import { Navigate, NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const LINKS = [
  { to: '/admin', end: true, icon: 'bi-speedometer2', label: 'Tổng quan' },
  { to: '/admin/san-pham', icon: 'bi-box-seam', label: 'Sản phẩm' },
  { to: '/admin/danh-muc', icon: 'bi-grid', label: 'Danh mục' },
  { to: '/admin/don-hang', icon: 'bi-receipt', label: 'Đơn hàng' },
];

function AdminLayout() {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) return <Navigate to="/dang-nhap" replace state={{ from: '/admin' }} />;
  if (user?.role !== 'ADMIN') return <Navigate to="/" replace />;

  return (
    <div className="container-fluid py-4">
      <div className="row">
        <div className="col-lg-2 mb-4">
          <h2 className="fw-bold fs-5 mb-3">Quản trị</h2>
          <ul className="nav nav-pills flex-lg-column gap-1">
            {LINKS.map((l) => (
              <li className="nav-item" key={l.to}>
                <NavLink to={l.to} end={l.end} className={({ isActive }) => `nav-link ${isActive ? 'active' : 'text-dark'}`}>
                  <i className={`bi ${l.icon}`}></i> {l.label}
                </NavLink>
              </li>
            ))}
            <li className="nav-item mt-lg-3">
              <NavLink to="/" className="nav-link text-muted">
                <i className="bi bi-arrow-left"></i> Về trang bán hàng
              </NavLink>
            </li>
          </ul>
        </div>
        <div className="col-lg-10">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

export default AdminLayout;
