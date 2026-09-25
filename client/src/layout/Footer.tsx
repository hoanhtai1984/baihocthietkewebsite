import { Link } from 'react-router-dom';

function Footer() {
  return (
    <footer className="site-footer bg-dark text-light pt-5 pb-3 mt-5">
      <div className="container">
        <div className="row g-4">
          <div className="col-md-4">
            <span className="fw-bold fs-4 text-warning d-block mb-2">
              <i className="bi bi-lightning-charge-fill"></i> ĐiệnMáyMini
            </span>
            <p className="text-white-50 small mb-0">
              Đồ án cuối kỳ khoá Lập trình Full-stack JavaScript - web bán đồ
              điện máy thu gọn, lấy cảm hứng giao diện từ dienmaynk.vn.
            </p>
          </div>
          <div className="col-md-4">
            <h6 className="text-uppercase fw-bold mb-3">Liên kết</h6>
            <ul className="list-unstyled small">
              <li className="mb-2"><Link to="/" className="text-white-50">Trang chủ</Link></li>
              <li className="mb-2"><Link to="/danh-muc" className="text-white-50">Tất cả sản phẩm</Link></li>
              <li className="mb-2"><Link to="/gio-hang" className="text-white-50">Giỏ hàng</Link></li>
              <li className="mb-2"><Link to="/don-hang-cua-toi" className="text-white-50">Đơn hàng của tôi</Link></li>
            </ul>
          </div>
          <div className="col-md-4">
            <h6 className="text-uppercase fw-bold mb-3">Liên hệ</h6>
            <p className="text-white-50 small mb-1"><i className="bi bi-telephone-fill"></i> 0000 000 000</p>
            <p className="text-white-50 small mb-1"><i className="bi bi-envelope-fill"></i> demo@example.com</p>
          </div>
        </div>
        <hr className="border-secondary mt-4" />
        <p className="text-center text-white-50 small mb-0">© {new Date().getFullYear()} ĐiệnMáyMini - Đồ án cuối kỳ</p>
      </div>
    </footer>
  );
}

export default Footer;
