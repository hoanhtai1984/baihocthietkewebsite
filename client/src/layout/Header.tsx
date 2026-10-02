import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getCategories } from '../api/categories';
import { getProducts } from '../api/products';
import useCartCount from '../hooks/useCartCount';
import { useAuth } from '../context/AuthContext';
import { formatMoney } from '../utils/format';

interface Category {
  id: number;
  slug: string;
  name: string;
  icon?: string | null;
}

function Header() {
  const [categories, setCategories] = useState<Category[]>([]);
  const cartCount = useCartCount();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();

  const [sticky, setSticky] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const accountRef = useRef<HTMLDivElement>(null);

  const [keyword, setKeyword] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchBoxRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    getCategories().then(setCategories).catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    function onScroll() {
      setSticky(window.scrollY > 80);
    }
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (accountRef.current && !accountRef.current.contains(e.target as Node)) {
        setAccountMenuOpen(false);
      }
      if (searchBoxRef.current && !searchBoxRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('click', onClickOutside);
    return () => document.removeEventListener('click', onClickOutside);
  }, []);

  function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    setKeyword(value);
    clearTimeout(debounceRef.current);
    if (!value.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    debounceRef.current = setTimeout(() => {
      getProducts({ search: value })
        .then((results: any[]) => {
          setSuggestions(results.slice(0, 5));
          setShowSuggestions(true);
        })
        .catch(() => setShowSuggestions(false));
    }, 300);
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = keyword.trim();
    if (trimmed) {
      setShowSuggestions(false);
      navigate(`/danh-muc?q=${encodeURIComponent(trimmed)}`);
    }
  }

  return (
    <>
      <header id="site-header" className={sticky ? 'sticky' : ''}>
        <div className="top-bar">
          <div className="container">
            <div className="row align-items-center">
              <div className="col-12 text-center">
                <div className="top-left">
                  <i className="bi bi-shop"></i> Đồ án cuối kỳ - Web Điện Máy Mini
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="main-header">
          <div className="container">
            <div className="row align-items-center gy-3">
              <div className="col-lg-2 col-md-3 col-6">
                <Link to="/" className="logo">
                  <span className="fw-bold fs-4 text-dark">
                    <i className="bi bi-lightning-charge-fill"></i> ĐiệnMáyMini
                  </span>
                </Link>
              </div>
              <div className="col-lg-5 col-md-6 col-12 order-3 order-md-2 header-search-col">
                <form className="search-form" onSubmit={handleSearchSubmit}>
                  <div className="search-box" ref={searchBoxRef}>
                    <i className="bi bi-search"></i>
                    <input
                      type="text"
                      autoComplete="off"
                      placeholder="Bạn cần tìm gì hôm nay?"
                      value={keyword}
                      onChange={handleSearchChange}
                      onFocus={() => { if (keyword.trim()) setShowSuggestions(true); }}
                    />
                    <button type="submit" className="d-none d-md-inline-block">Tìm kiếm</button>
                    {showSuggestions && (
                      <div className="search-suggestions">
                        {suggestions.length === 0 ? (
                          <div className="p-3 text-muted text-center small">
                            <i className="bi bi-exclamation-circle"></i> Không tìm thấy sản phẩm phù hợp
                          </div>
                        ) : (
                          suggestions.map((p) => (
                            <Link
                              key={p.id}
                              to={`/san-pham/${p.slug}`}
                              className="suggestion-item"
                              onClick={() => setShowSuggestions(false)}
                            >
                              <img src={p.image} alt={p.name} className="suggestion-img" width={42} height={42} />
                              <div className="flex-grow-1 min-width-0">
                                <p className="suggestion-title text-dark text-truncate">{p.name}</p>
                                <span className="suggestion-price">{formatMoney(p.price)}</span>
                              </div>
                            </Link>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                </form>
              </div>
              <div className="col-lg-5 col-md-3 col-6 order-2 order-md-3 header-actions-col">
                <div className="header-right">
                  {isAuthenticated ? (
                    <div className="header-item account-item d-none d-lg-flex position-relative" ref={accountRef}>
                      <div role="button" style={{ cursor: 'pointer' }} onClick={() => setAccountMenuOpen((v) => !v)}>
                        <i className="bi bi-person-check-fill"></i>
                        <div>
                          <small>Xin chào</small>
                          <strong>{user?.name.split(' ')[0]}</strong>
                        </div>
                      </div>
                      {accountMenuOpen && (
                        <div className="account-hover-preview" style={{ display: 'block', position: 'absolute', top: '100%', right: 0, zIndex: 10 }}>
                          <div className="fw-bold mb-2">{user?.name}</div>
                          <Link to="/tai-khoan" className="d-block mb-2" onClick={() => setAccountMenuOpen(false)}>
                            <i className="bi bi-person-gear"></i> Tài khoản của tôi
                          </Link>
                          <Link to="/don-hang-cua-toi" className="d-block mb-2" onClick={() => setAccountMenuOpen(false)}>
                            <i className="bi bi-receipt"></i> Đơn hàng của tôi
                          </Link>
                          {user?.role === 'ADMIN' && (
                            <Link to="/admin" className="d-block mb-2" onClick={() => setAccountMenuOpen(false)}>
                              <i className="bi bi-speedometer2"></i> Trang quản trị
                            </Link>
                          )}
                          <button type="button" className="btn btn-sm btn-outline-danger w-100" onClick={() => { setAccountMenuOpen(false); logout(); navigate('/'); }}>
                            Đăng xuất
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <Link to="/dang-nhap" className="header-item d-none d-lg-flex">
                      <i className="bi bi-person-circle"></i>
                      <div>
                        <small>Tài khoản</small>
                        <strong>Đăng nhập</strong>
                      </div>
                    </Link>
                  )}
                  <Link to="/gio-hang" className="cart-btn" aria-label="Giỏ hàng">
                    <i className="bi bi-cart3"></i>
                    <span className="cart-btn-label d-none d-md-inline">Giỏ hàng</span>
                    <span className="cart-count">{cartCount}</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        <nav className="main-nav navbar navbar-expand-lg">
          <div className="container">
            <button className="navbar-toggler me-auto my-2" type="button" onClick={() => setMobileMenuOpen((v) => !v)}>
              <i className="bi bi-list"></i> Danh Mục Sản Phẩm
            </button>
            {!isAuthenticated && (
              <Link to="/dang-nhap" className="header-icon d-lg-none my-2" aria-label="Đăng nhập">
                <i className="bi bi-person-circle"></i>
              </Link>
            )}
            <div className={`collapse navbar-collapse${mobileMenuOpen ? ' show' : ''}`}>
              <ul className="navbar-nav w-100 justify-content-center">
                {categories.map((cat) => (
                  <li className="nav-item" key={cat.slug}>
                    <Link className="nav-link" to={`/danh-muc/${cat.slug}`} onClick={() => setMobileMenuOpen(false)}>
                      <i className={`bi ${cat.icon || 'bi-tag'}`}></i> {cat.name}
                    </Link>
                  </li>
                ))}
                {/* Trên điện thoại menu tài khoản ở header bị ẩn - đưa các lối đi chính vào menu này */}
                <li className="nav-item d-lg-none">
                  <Link className="nav-link" to="/tra-cuu-don-hang" onClick={() => setMobileMenuOpen(false)}>
                    <i className="bi bi-search"></i> Tra cứu đơn hàng
                  </Link>
                </li>
                {isAuthenticated ? (
                  <>
                    <li className="nav-item d-lg-none">
                      <Link className="nav-link" to="/don-hang-cua-toi" onClick={() => setMobileMenuOpen(false)}>
                        <i className="bi bi-receipt"></i> Đơn hàng của tôi
                      </Link>
                    </li>
                    <li className="nav-item d-lg-none">
                      <Link className="nav-link" to="/tai-khoan" onClick={() => setMobileMenuOpen(false)}>
                        <i className="bi bi-person-gear"></i> Tài khoản của tôi
                      </Link>
                    </li>
                    {user?.role === 'ADMIN' && (
                      <li className="nav-item d-lg-none">
                        <Link className="nav-link" to="/admin" onClick={() => setMobileMenuOpen(false)}>
                          <i className="bi bi-speedometer2"></i> Trang quản trị
                        </Link>
                      </li>
                    )}
                    <li className="nav-item d-lg-none">
                      <button type="button" className="nav-link btn btn-link text-start" onClick={() => { setMobileMenuOpen(false); logout(); navigate('/'); }}>
                        <i className="bi bi-box-arrow-right"></i> Đăng xuất
                      </button>
                    </li>
                  </>
                ) : null}
              </ul>
            </div>
          </div>
        </nav>
      </header>
      {sticky && <div style={{ height: 120 }} aria-hidden="true" />}
    </>
  );
}

export default Header;
