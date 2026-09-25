import { Link } from 'react-router-dom';

function NotFound() {
  return (
    <div className="container py-5 text-center">
      <h1 className="fw-bold display-4">404</h1>
      <p className="text-muted mb-4">Không tìm thấy trang bạn yêu cầu.</p>
      <Link to="/" className="btn btn-warning fw-bold">Về trang chủ</Link>
    </div>
  );
}

export default NotFound;
