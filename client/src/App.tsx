import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Layout from './layout/Layout';
import AdminLayout from './layout/AdminLayout';
import RequireAuth from './components/RequireAuth';

import Home from './pages/Home';
import Category from './pages/Category';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import OrderSuccess from './pages/OrderSuccess';
import OrderLookup from './pages/OrderLookup';
import Login from './pages/Login';
import MyOrders from './pages/MyOrders';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';

import AdminDashboard from './pages/admin/AdminDashboard';
import AdminProducts from './pages/admin/AdminProducts';
import AdminCategories from './pages/admin/AdminCategories';
import AdminOrders from './pages/admin/AdminOrders';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
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
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
