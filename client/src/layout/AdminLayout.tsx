import { Navigate, NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function AdminLayout() {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) return <Navigate to="/dang-nhap" replace />;
  if (user?.role !== 'ADMIN') return <Navigate to="/" replace />;

  return (
    <div className="container-fluid py-4">
      <div className="row">
        <div className="col-lg-2 mb-4">
          <h2 className="fw-bold fs-5 mb-3">Quản trị</h2>
          <ul className="nav nav-pills flex-column gap-1">
            <li className="nav-item">
              <NavLink to="/admin/san-pham" className={({ isActive }) => `nav-link ${isActive ? 'active' : 'text-dark'}`}>
                <i className="bi bi-box-seam"></i> Sản phẩm
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink to="/admin/danh-muc" className={({ isActive }) => `nav-link ${isActive ? 'active' : 'text-dark'}`}>
                <i className="bi bi-grid"></i> Danh mục
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink to="/admin/don-hang" className={({ isActive }) => `nav-link ${isActive ? 'active' : 'text-dark'}`}>
                <i className="bi bi-receipt"></i> Đơn hàng
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
