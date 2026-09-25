import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Login() {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<'login' | 'register'>('login');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await register(name, email, password, phone || undefined);
      }
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra, thử lại sau');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-md-5">
          <div className="border rounded-3 p-4">
            <div className="d-flex gap-2 mb-4">
              <button
                type="button"
                className={`btn flex-fill ${mode === 'login' ? 'btn-warning fw-bold' : 'btn-outline-secondary'}`}
                onClick={() => setMode('login')}
              >
                Đăng nhập
              </button>
              <button
                type="button"
                className={`btn flex-fill ${mode === 'register' ? 'btn-warning fw-bold' : 'btn-outline-secondary'}`}
                onClick={() => setMode('register')}
              >
                Đăng ký
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              {mode === 'register' && (
                <input
                  type="text"
                  className="form-control mb-2"
                  placeholder="Họ tên"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              )}
              <input
                type="email"
                className="form-control mb-2"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <input
                type="password"
                className="form-control mb-2"
                placeholder="Mật khẩu (ít nhất 6 ký tự)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
                required
              />
              {mode === 'register' && (
                <input
                  type="text"
                  className="form-control mb-3"
                  placeholder="Số điện thoại (không bắt buộc)"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              )}
              {error && <p className="text-danger small">{error}</p>}
              <button type="submit" className="btn btn-warning w-100 fw-bold" disabled={submitting}>
                {submitting ? 'Đang xử lý...' : mode === 'login' ? 'Đăng nhập' : 'Đăng ký'}
              </button>
            </form>

            <p className="text-center small text-muted mt-3 mb-0">
              <Link to="/">Quay lại trang chủ</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
