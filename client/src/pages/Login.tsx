import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiErrorMessage } from '../utils/toast';
import useDocumentTitle from '../hooks/useDocumentTitle';

function Login() {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from;
  const [mode, setMode] = useState<'login' | 'register'>('login');
  useDocumentTitle(mode === 'login' ? 'Đăng nhập' : 'Đăng ký');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const user =
        mode === 'login'
          ? await login(email.trim(), password)
          : await register(name.trim(), email.trim(), password, phone.trim() || undefined);
      // Quay lại trang đang định vào; admin đăng nhập từ trang chung thì vào thẳng trang quản trị.
      navigate(from || (user.role === 'ADMIN' ? '/admin' : '/'), { replace: true });
    } catch (err) {
      setError(apiErrorMessage(err, 'Có lỗi xảy ra, thử lại sau'));
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
                onClick={() => { setMode('login'); setError(''); }}
              >
                Đăng nhập
              </button>
              <button
                type="button"
                className={`btn flex-fill ${mode === 'register' ? 'btn-warning fw-bold' : 'btn-outline-secondary'}`}
                onClick={() => { setMode('register'); setError(''); }}
              >
                Đăng ký
              </button>
            </div>

            {from && <p className="small text-muted">Vui lòng đăng nhập để tiếp tục.</p>}

            <form onSubmit={handleSubmit}>
              {mode === 'register' && (
                <input
                  type="text"
                  className="form-control mb-2"
                  placeholder="Họ tên"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={100}
                  required
                />
              )}
              <input
                type="email"
                className="form-control mb-2"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
              <div className="input-group mb-2">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-control"
                  placeholder="Mật khẩu (ít nhất 6 ký tự)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  minLength={6}
                  required
                />
                <button type="button" className="btn btn-outline-secondary" onClick={() => setShowPassword((v) => !v)} aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}>
                  <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                </button>
              </div>
              {mode === 'register' && (
                <input
                  type="tel"
                  className="form-control mb-3"
                  placeholder="Số điện thoại (không bắt buộc)"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              )}
              {error && <p className="text-danger small mt-2">{error}</p>}
              <button type="submit" className="btn btn-warning w-100 fw-bold mt-2" disabled={submitting}>
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
