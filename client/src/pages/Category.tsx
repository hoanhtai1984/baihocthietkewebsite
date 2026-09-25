import { useEffect, useState } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { getProducts } from '../api/products';
import { getCategories } from '../api/categories';
import ProductCard from '../components/ProductCard';

function Category() {
  const { categorySlug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get('q') || '';

  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState(search);

  useEffect(() => {
    getCategories().then(setCategories).catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    setLoading(true);
    getProducts({ category: categorySlug, search: search || undefined })
      .then(setProducts)
      .finally(() => setLoading(false));
  }, [categorySlug, search]);

  useEffect(() => {
    setKeyword(search);
  }, [search]);

  const activeCategory = categories.find((c) => c.slug === categorySlug);

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params: Record<string, string> = {};
    if (keyword.trim()) params.q = keyword.trim();
    setSearchParams(params);
  }

  return (
    <div className="container py-4">
      <nav aria-label="breadcrumb" className="mb-3">
        <ol className="breadcrumb m-0">
          <li className="breadcrumb-item"><Link to="/">Trang chủ</Link></li>
          <li className="breadcrumb-item"><Link to="/danh-muc">Sản phẩm</Link></li>
          {activeCategory && <li className="breadcrumb-item active">{activeCategory.name}</li>}
        </ol>
      </nav>

      <div className="row">
        <div className="col-lg-3 mb-4">
          <div className="border rounded-3 p-3">
            <h6 className="fw-bold mb-3">Tìm kiếm</h6>
            <form onSubmit={handleSearchSubmit} className="d-flex gap-2 mb-4">
              <input
                type="text"
                className="form-control form-control-sm"
                placeholder="Tên sản phẩm..."
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
              />
              <button type="submit" className="btn btn-sm btn-warning">
                <i className="bi bi-search"></i>
              </button>
            </form>
            <h6 className="fw-bold mb-3">Danh mục</h6>
            <ul className="list-unstyled">
              <li className="mb-2">
                <Link to="/danh-muc" className={!categorySlug ? 'fw-bold text-warning' : 'text-dark'}>
                  Tất cả sản phẩm
                </Link>
              </li>
              {categories.map((cat) => (
                <li className="mb-2" key={cat.slug}>
                  <Link
                    to={`/danh-muc/${cat.slug}`}
                    className={cat.slug === categorySlug ? 'fw-bold text-warning' : 'text-dark'}
                  >
                    <i className={`bi ${cat.icon || 'bi-tag'}`}></i> {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="col-lg-9">
          <h1 className="fw-bold fs-4 mb-3">
            {activeCategory ? activeCategory.name : search ? `Kết quả cho "${search}"` : 'Tất cả sản phẩm'}
          </h1>
          {loading ? (
            <p className="text-muted">Đang tải...</p>
          ) : products.length === 0 ? (
            <p className="text-muted">Không có sản phẩm nào phù hợp.</p>
          ) : (
            <div className="row row-cols-2 row-cols-md-3 g-3">
              {products.map((p) => (
                <div className="col" key={p.id}>
                  <ProductCard product={p} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Category;
