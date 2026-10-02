import { Link, Navigate, useLocation } from 'react-router-dom';
import { formatMoney } from '../utils/format';
import useDocumentTitle from '../hooks/useDocumentTitle';

interface SuccessState {
  code: string;
  total: number;
  phone: string;
  isGuest: boolean;
}

function OrderSuccess() {
  useDocumentTitle('Đặt hàng thành công');
  const state = useLocation().state as SuccessState | null;

  // Vào thẳng URL này (không qua bước đặt hàng) thì không có gì để hiển thị.
  if (!state?.code) return <Navigate to="/" replace />;

  return (
    <div className="container py-5 text-center" style={{ maxWidth: 560 }}>
      <i className="bi bi-check-circle-fill text-success" style={{ fontSize: 64 }}></i>
      <h1 className="fw-bold fs-3 mt-3">Đặt hàng thành công!</h1>
      <p className="text-muted">Cảm ơn bạn. Chúng tôi sẽ liên hệ xác nhận đơn hàng sớm nhất.</p>

      <div className="border rounded-3 p-3 my-4 text-start">
        <div className="d-flex justify-content-between mb-2">
          <span className="text-muted">Mã đơn hàng</span>
          <strong className="fs-5">{state.code}</strong>
        </div>
        <div className="d-flex justify-content-between">
          <span className="text-muted">Tổng thanh toán (COD)</span>
          <strong className="text-danger">{formatMoney(state.total)}</strong>
        </div>
      </div>

      {state.isGuest && (
        <p className="small text-muted">
          Hãy lưu lại mã đơn <strong>{state.code}</strong> và số điện thoại <strong>{state.phone}</strong> để tra cứu trạng thái đơn hàng.
        </p>
      )}

      <div className="d-flex gap-2 justify-content-center flex-wrap">
        {state.isGuest ? (
          <Link to="/tra-cuu-don-hang" className="btn btn-outline-primary fw-bold">Tra cứu đơn hàng</Link>
        ) : (
          <Link to="/don-hang-cua-toi" className="btn btn-outline-primary fw-bold">Xem đơn hàng của tôi</Link>
        )}
        <Link to="/danh-muc" className="btn btn-warning fw-bold">Tiếp tục mua sắm</Link>
      </div>
    </div>
  );
}

export default OrderSuccess;
