import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getCart, saveCart, removeItem, updateQty, clearCart, type CartItem } from '../utils/cart';
import { formatMoney } from '../utils/format';
import { createOrder } from '../api/orders';
import { getProduct } from '../api/products';
import { useAuth } from '../context/AuthContext';
import { showToast, apiErrorMessage, apiErrorStatus } from '../utils/toast';
import useDocumentTitle from '../hooks/useDocumentTitle';

const PHONE_REGEX = /^(0|\+84)\d{9,10}$/;

function Cart() {
  useDocumentTitle('Giỏ hàng');
  const [cart, setCart] = useState<CartItem[]>(() => getCart());
  const [syncing, setSyncing] = useState(() => getCart().length > 0);
  const [notices, setNotices] = useState<string[]>([]);
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  const [receiverName, setReceiverName] = useState(user?.name || '');
  const [receiverPhone, setReceiverPhone] = useState(user?.phone || '');
  const [receiverAddress, setReceiverAddress] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Mở giỏ hàng là đối chiếu lại với server: giá/tồn kho có thể đã đổi, sản phẩm
  // có thể đã bị ẩn/xoá kể từ lúc khách thêm vào giỏ (giỏ lưu ở trình duyệt).
  useEffect(() => {
    const current = getCart();
    if (current.length === 0) return;
    let cancelled = false;
    (async () => {
      const messages: string[] = [];
      const updated: CartItem[] = [];
      await Promise.all(
        current.map(async (item) => {
          try {
            const p = await getProduct(item.slug);
            if (p.stock <= 0) {
              messages.push(`"${item.name}" đã hết hàng nên được bỏ khỏi giỏ.`);
              return;
            }
            let qty = item.qty;
            if (qty > p.stock) {
              qty = p.stock;
              messages.push(`"${item.name}" chỉ còn ${p.stock} sản phẩm, đã giảm số lượng trong giỏ.`);
            }
            if (p.price !== item.price) {
              messages.push(`Giá "${item.name}" đã thay đổi: ${formatMoney(item.price)} → ${formatMoney(p.price)}.`);
            }
            updated.push({ ...item, price: p.price, stock: p.stock, name: p.name, image: p.image, qty });
          } catch (err) {
            if (apiErrorStatus(err) === 404) {
              messages.push(`"${item.name}" không còn được bán nên được bỏ khỏi giỏ.`);
            } else {
              updated.push(item); // lỗi mạng: giữ nguyên, server sẽ kiểm tra lại lúc đặt hàng
            }
          }
        }),
      );
      if (cancelled) return;
      // Giữ nguyên thứ tự ban đầu của giỏ
      const ordered = current.map((c) => updated.find((u) => u.id === c.id)).filter(Boolean) as CartItem[];
      saveCart(ordered);
      setCart(ordered);
      setNotices(messages);
      setSyncing(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  async function handleCheckout(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const name = receiverName.trim();
    const phone = receiverPhone.trim();
    const address = receiverAddress.trim();
    if (!name || !phone || !address) {
      setError('Vui lòng nhập đầy đủ họ tên, số điện thoại và địa chỉ nhận hàng');
      return;
    }
    if (!PHONE_REGEX.test(phone.replace(/[\s.-]/g, ''))) {
      setError('Số điện thoại không hợp lệ (ví dụ 0912345678)');
      return;
    }
    setSubmitting(true);
    try {
      const order = await createOrder({
        items: cart.map((item) => ({ productId: item.id, quantity: item.qty })),
        guestName: name,
        guestPhone: phone,
        guestAddress: address,
      });
      clearCart();
      navigate('/dat-hang-thanh-cong', { replace: true, state: { code: order.code, total: order.totalAmount, phone, isGuest: !isAuthenticated } });
    } catch (err) {
      const message = apiErrorMessage(err, 'Đặt hàng thất bại, thử lại sau');
      setError(message);
      showToast(message, 'error');
    } finally {
      setSubmitting(false);
    }
  }

  if (syncing) {
    return <div className="container py-5 text-center text-muted">Đang kiểm tra giỏ hàng...</div>;
  }

  if (cart.length === 0) {
    return (
      <div className="container py-5 text-center">
        <i className="bi bi-cart-x fs-1 text-muted d-block mb-3"></i>
        <h1 className="fw-bold fs-4">Giỏ hàng trống</h1>
        {notices.map((n) => (
          <p key={n} className="small text-warning-emphasis mb-1">{n}</p>
        ))}
        <Link to="/danh-muc" className="btn btn-warning fw-bold mt-3">Tiếp tục mua sắm</Link>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <h1 className="fw-bold fs-3 mb-4">Giỏ hàng</h1>
      {notices.length > 0 && (
        <div className="alert alert-warning">
          {notices.map((n) => (
            <div key={n}>{n}</div>
          ))}
        </div>
      )}
      <div className="row g-4">
        <div className="col-lg-7">
          {cart.map((item) => (
            <div key={item.id} className="d-flex align-items-center gap-3 border rounded-3 p-3 mb-3">
              <Link to={`/san-pham/${item.slug}`}>
                <img src={item.image} alt={item.name} width={72} height={72} style={{ objectFit: 'contain' }} />
              </Link>
              <div className="flex-grow-1">
                <Link to={`/san-pham/${item.slug}`} className="fw-semibold text-dark text-decoration-none">{item.name}</Link>
                <div className="text-danger fw-bold">{formatMoney(item.price)}</div>
                {item.stock !== undefined && item.stock <= 5 && (
                  <div className="small text-warning-emphasis">Chỉ còn {item.stock} sản phẩm</div>
                )}
              </div>
              <div className="text-center">
                <div className="input-group input-group-sm" style={{ width: 120 }}>
                  <button type="button" className="btn btn-outline-secondary" onClick={() => setCart(updateQty(item.id, item.qty - 1))} disabled={item.qty <= 1}>−</button>
                  <input
                    type="number"
                    min={1}
                    max={item.stock ?? 99}
                    className="form-control text-center"
                    value={item.qty}
                    onChange={(e) => setCart(updateQty(item.id, Number(e.target.value) || 1))}
                  />
                  <button type="button" className="btn btn-outline-secondary" onClick={() => setCart(updateQty(item.id, item.qty + 1))} disabled={item.qty >= (item.stock ?? 99)}>+</button>
                </div>
                <div className="small text-muted mt-1">{formatMoney(item.price * item.qty)}</div>
              </div>
              <button className="btn btn-outline-danger btn-sm" onClick={() => setCart(removeItem(item.id))} aria-label="Xoá khỏi giỏ">
                <i className="bi bi-trash"></i>
              </button>
            </div>
          ))}
        </div>

        <div className="col-lg-5">
          <div className="border rounded-3 p-3 cart-summary-sticky" style={{ position: 'sticky', top: 16 }}>
            <h2 className="fw-bold fs-5 mb-3">Thông tin nhận hàng</h2>

            <form onSubmit={handleCheckout}>
              <input
                type="text"
                className="form-control mb-2"
                placeholder="Họ tên người nhận"
                value={receiverName}
                onChange={(e) => setReceiverName(e.target.value)}
                maxLength={100}
              />
              <input
                type="tel"
                className="form-control mb-2"
                placeholder="Số điện thoại"
                value={receiverPhone}
                onChange={(e) => setReceiverPhone(e.target.value)}
                maxLength={20}
              />
              <textarea
                className="form-control mb-3"
                placeholder="Địa chỉ giao hàng (số nhà, đường, phường/xã, quận/huyện, tỉnh/thành)"
                rows={2}
                value={receiverAddress}
                onChange={(e) => setReceiverAddress(e.target.value)}
                maxLength={255}
              />
              {isAuthenticated ? (
                <p className="small text-muted mb-3">Đặt hàng với tài khoản: {user?.email}</p>
              ) : (
                <p className="small text-muted mb-3">
                  Bạn đang đặt hàng không cần tài khoản. <Link to="/dang-nhap" state={{ from: '/gio-hang' }}>Đăng nhập</Link> để theo dõi đơn dễ hơn.
                </p>
              )}

              <div className="d-flex justify-content-between mb-3">
                <span>Tổng cộng</span>
                <span className="fw-bold text-danger fs-5">{formatMoney(total)}</span>
              </div>
              {error && <p className="text-danger small">{error}</p>}
              <button type="submit" className="btn btn-warning w-100 fw-bold" disabled={submitting}>
                {submitting ? 'Đang xử lý...' : 'Đặt hàng'}
              </button>
              <p className="small text-muted text-center mt-2 mb-0">Thanh toán khi nhận hàng (COD)</p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Cart;
