import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Layout from './layout/Layout';
import AdminLayout from './layout/AdminLayout';
import RequireAuth from './components/RequireAuth';

import Home from './pages/Home';
const Category = lazy(() => import('./pages/Category'));
const ProductDetail = lazy(() => import('./pages/ProductDetail'));
const Cart = lazy(() => import('./pages/Cart'));
const OrderSuccess = lazy(() => import('./pages/OrderSuccess'));
const OrderLookup = lazy(() => import('./pages/OrderLookup'));
const Login = lazy(() => import('./pages/Login'));
const MyOrders = lazy(() => import('./pages/MyOrders'));
const Profile = lazy(() => import('./pages/Profile'));
const NotFound = lazy(() => import('./pages/NotFound'));

const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminProducts = lazy(() => import('./pages/admin/AdminProducts'));
const AdminCategories = lazy(() => import('./pages/admin/AdminCategories'));
const AdminOrders = lazy(() => import('./pages/admin/AdminOrders'));

// Trang chủ tải ngay (vào web là thấy); các trang còn lại + khu quản trị tách
// thành từng gói riêng, chỉ tải khi người dùng thật sự vào (code splitting).
function PageFallback() {
  return <div className="container py-5 text-center text-muted">Đang tải...</div>;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Suspense fallback={<PageFallback />}>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="danh-muc" element={<Category />} />
            <Route path="danh-muc/:categorySlug" element={<Category />} />
            <Route path="san-pham/:slug" element={<ProductDetail />} />
            <Route path="gio-hang" element={<Cart />} />
            <Route path="dat-hang-thanh-cong" element={<OrderSuccess />} />
            <Route path="tra-cuu-don-hang" element={<OrderLookup />} />
            <Route path="dang-nhap" element={<Login />} />
            <Route path="don-hang-cua-toi" element={<RequireAuth><MyOrders /></RequireAuth>} />
            <Route path="tai-khoan" element={<RequireAuth><Profile /></RequireAuth>} />
            <Route path="*" element={<NotFound />} />
          </Route>

          <Route path="admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="san-pham" element={<AdminProducts />} />
            <Route path="danh-muc" element={<AdminCategories />} />
            <Route path="don-hang" element={<AdminOrders />} />
          </Route>
        </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
