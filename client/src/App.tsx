import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Layout from './layout/Layout';
import AdminLayout from './layout/AdminLayout';

import Home from './pages/Home';
import Category from './pages/Category';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Login from './pages/Login';
import MyOrders from './pages/MyOrders';
import NotFound from './pages/NotFound';

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
            <Route path="dang-nhap" element={<Login />} />
            <Route path="don-hang-cua-toi" element={<MyOrders />} />
            <Route path="*" element={<NotFound />} />
          </Route>

          <Route path="admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="san-pham" replace />} />
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
