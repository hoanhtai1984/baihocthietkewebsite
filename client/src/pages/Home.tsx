import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getProducts } from '../api/products';
import { getCategories } from '../api/categories';
import ProductCard from '../components/ProductCard';
import AiSuggestBox from '../components/AiSuggestBox';
import useDocumentTitle from '../hooks/useDocumentTitle';
import { apiErrorMessage } from '../utils/toast';
import type { Category, Product } from '../types';

function Home() {
  useDocumentTitle();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    Promise.all([getProducts(), getCategories()])
      .then(([p, c]) => {
        if (cancelled) return;
        setProducts(p.items);
        setCategories(c);
        setError('');
      })
      .catch((err) => {
        if (!cancelled) setError(apiErrorMessage(err, 'Không kết nối được máy chủ'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  return (
    <div>
      <section className="py-5 text-center text-white" style={{ background: 'linear-gradient(135deg, #212529, #495057)' }}>
        <div className="container">
          <h1 className="fw-bold display-6 mb-2">Điện máy chính hãng, giá tốt mỗi ngày</h1>
          <p className="text-white-50 mb-0">Đồ án cuối kỳ - web bán đồ điện máy thu gọn</p>
        </div>
      </section>

      <div className="container py-4">
        <AiSuggestBox />

        <div className="row g-3 my-2">
          {categories.map((cat) => (
            <div className="col-6 col-md-3" key={cat.slug}>
              <Link to={`/danh-muc/${cat.slug}`} className="d-block text-center p-3 border rounded-3 text-decoration-none text-dark h-100">
                <i className={`bi ${cat.icon || 'bi-tag'} fs-2 text-warning d-block mb-2`}></i>
                <span className="fw-semibold">{cat.name}</span>
              </Link>
            </div>
          ))}
        </div>

        <h2 className="fw-bold fs-4 mt-4 mb-3">Sản phẩm nổi bật</h2>
        {loading ? (
          <p className="text-muted">Đang tải...</p>
        ) : error ? (
          <div className="text-center py-4">
            <p className="text-danger">{error}</p>
            <button className="btn btn-outline-secondary" onClick={() => { setLoading(true); setReloadKey((k) => k + 1); }}>Thử lại</button>
          </div>
        ) : products.length === 0 ? (
          <p className="text-muted">Chưa có sản phẩm nào.</p>
        ) : (
          <div className="row row-cols-2 row-cols-md-3 row-cols-lg-4 g-3">
            {products.map((p) => (
              <div className="col" key={p.id}>
                <ProductCard product={p} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Home;
