import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getCart, removeItem, updateQty, clearCart, type CartItem } from '../utils/cart';
import { formatMoney } from '../utils/format';
import { createOrder } from '../api/orders';
import { useAuth } from '../context/AuthContext';
import { showToast } from '../utils/toast';

function Cart() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [guestAddress, setGuestAddress] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setCart(getCart());
  }, []);

  useEffect(() => {
    if (isAuthenticated && user) {
      setGuestName(user.name);
    }
  }, [isAuthenticated, user]);

  function refresh(next: CartItem[]) {
    setCart(next);
  }

  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  async function handleCheckout(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!isAuthenticated && (!guestName.trim() || !guestPhone.trim() || !guestAddress.trim())) {
      setError('Vui lòng nhập đầy đủ tên, số điện thoại, địa chỉ');
      return;
    }
    setSubmitting(true);
    try {
      const order = await createOrder({
        items: cart.map((item) => ({ productId: item.id, quantity: item.qty })),
        guestName: isAuthenticated ? undefined : guestName,
        guestPhone: isAuthenticated ? undefined : guestPhone,
        guestAddress: isAuthenticated ? undefined : guestAddress,
      });
      clearCart();
      showToast(`Đặt hàng thành công! Mã đơn: ${order.code}`);
      navigate(isAuthenticated ? '/don-hang-cua-toi' : '/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Đặt hàng thất bại, thử lại sau');
    } finally {
      setSubmitting(false);
    }
  }

  if (cart.length === 0) {
    return (
      <div className="container py-5 text-center">
        <i className="bi bi-cart-x fs-1 text-muted d-block mb-3"></i>
        <h1 className="fw-bold fs-4">Giỏ hàng trống</h1>
        <Link to="/danh-muc" className="btn btn-warning fw-bold mt-3">Tiếp tục mua sắm</Link>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <h1 className="fw-bold fs-3 mb-4">Giỏ hàng</h1>
      <div className="row g-4">
        <div className="col-lg-8">
          {cart.map((item) => (
            <div key={item.id} className="d-flex align-items-center gap-3 border rounded-3 p-3 mb-3">
              <img src={item.image} alt={item.name} width={72} height={72} style={{ objectFit: 'contain' }} />
              <div className="flex-grow-1">
                <div className="fw-semibold">{item.name}</div>
                <div className="text-danger fw-bold">{formatMoney(item.price)}</div>
              </div>
              <input
                type="number"
                min={1}
                max={99}
                className="form-control"
                style={{ width: 80 }}
                value={item.qty}
                onChange={(e) => refresh(updateQty(item.id, Number(e.target.value) || 1))}
              />
              <button className="btn btn-outline-danger btn-sm" onClick={() => refresh(removeItem(item.id))}>
                <i className="bi bi-trash"></i>
              </button>
            </div>
          ))}
        </div>

        <div className="col-lg-4">
          <div className="border rounded-3 p-3 cart-summary-sticky" style={{ position: 'sticky', top: 16 }}>
            <h2 className="fw-bold fs-5 mb-3">Tóm tắt đơn hàng</h2>
            <div className="d-flex justify-content-between mb-3">
              <span>Tổng cộng</span>
              <span className="fw-bold text-danger fs-5">{formatMoney(total)}</span>
            </div>

            <form onSubmit={handleCheckout}>
              {!isAuthenticated && (
                <>
                  <input
                    type="text"
                    className="form-control mb-2"
                    placeholder="Họ tên người nhận"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                  />
                  <input
                    type="text"
                    className="form-control mb-2"
                    placeholder="Số điện thoại"
                    value={guestPhone}
                    onChange={(e) => setGuestPhone(e.target.value)}
                  />
                  <input
                    type="text"
                    className="form-control mb-3"
                    placeholder="Địa chỉ giao hàng"
                    value={guestAddress}
                    onChange={(e) => setGuestAddress(e.target.value)}
                  />
                </>
              )}
              {isAuthenticated && (
                <p className="small text-muted mb-3">Đặt hàng với tài khoản: {user?.email}</p>
              )}
              {error && <p className="text-danger small">{error}</p>}
              <button type="submit" className="btn btn-warning w-100 fw-bold" disabled={submitting}>
                {submitting ? 'Đang xử lý...' : 'Đặt hàng'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Cart;
