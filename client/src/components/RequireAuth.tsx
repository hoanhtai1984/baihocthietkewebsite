import { Navigate, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from '../context/AuthContext';

// Bọc các trang cần đăng nhập: chưa đăng nhập thì chuyển sang trang đăng nhập
// và nhớ trang đang định vào để đăng nhập xong quay lại đúng chỗ.
function RequireAuth({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  if (!isAuthenticated) {
    return <Navigate to="/dang-nhap" replace state={{ from: location.pathname + location.search }} />;
  }
  return <>{children}</>;
}

export default RequireAuth;
