import { useEffect, useState } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { getProducts, getBrands } from '../api/products';
import { getCategories } from '../api/categories';
import ProductCard from '../components/ProductCard';
import useDocumentTitle from '../hooks/useDocumentTitle';
import { apiErrorMessage } from '../utils/toast';

const SORT_OPTIONS = [
  { value: 'newest', label: 'Mới nhất' },
  { value: 'price-asc', label: 'Giá tăng dần' },
  { value: 'price-desc', label: 'Giá giảm dần' },
  { value: 'name-asc', label: 'Tên A → Z' },
];

// Khoảng giá lọc nhanh: value dạng "min-max" (để trống = không giới hạn đầu đó)
const PRICE_RANGES = [
  { value: '', label: 'Mọi mức giá' },
  { value: '-5000000', label: 'Dưới 5 triệu' },
  { value: '5000000-10000000', label: '5 - 10 triệu' },
  { value: '10000000-15000000', label: '10 - 15 triệu' },
  { value: '15000000-', label: 'Trên 15 triệu' },
];

// Ô tìm kiếm có state riêng - cha truyền key={search} để ô tự nạp lại giá trị
// mới khi URL đổi (bấm "Xoá bộ lọc", nhập từ thanh tìm kiếm trên header...).
function SearchBox({ initial, onSubmit }: { initial: string; onSubmit: (keyword: string) => void }) {
  const [keyword, setKeyword] = useState(initial);
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(keyword.trim());
      }}
      className="d-flex gap-2 mb-4"
    >
      <input
        type="text"
        className="form-control form-control-sm"
        placeholder="Tên sản phẩm..."
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
      />
      <button type="submit" className="btn btn-sm btn-warning" aria-label="Tìm kiếm">
        <i className="bi bi-search"></i>
      </button>
    </form>
  );
}

function Category() {
  const { categorySlug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get('q') || '';
  const brand = searchParams.get('brand') || '';
  const sort = searchParams.get('sort') || 'newest';
  const price = searchParams.get('price') || '';

  const [categories, setCategories] = useState<any[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [reloadKey, setReloadKey] = useState(0);
  // Kết quả gắn với "khoá truy vấn" của lần tải đó: khoá hiện tại khác khoá đã
  // tải = đang tải. Cách này không cần setState đồng bộ trong effect và không
  // bao giờ kẹt "đang tải" khi bộ lọc không đổi.
  const queryKey = JSON.stringify([categorySlug, search, brand, sort, price, reloadKey]);
  const [loaded, setLoaded] = useState<{ key: string; data: any[]; error: string } | null>(null);
  const loading = loaded?.key !== queryKey;
  const products = loaded?.data ?? [];
  const error = loaded?.key === queryKey ? loaded.error : '';

  useEffect(() => {
    getCategories().then(setCategories).catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    getBrands(categorySlug).then(setBrands).catch(() => setBrands([]));
  }, [categorySlug]);

  useEffect(() => {
    let cancelled = false;
    const [min, max] = price.split('-');
    getProducts({
      category: categorySlug,
      search: search || undefined,
      brand: brand || undefined,
      minPrice: min ? Number(min) : undefined,
      maxPrice: max ? Number(max) : undefined,
      sort,
    })
      .then((data) => {
        if (!cancelled) setLoaded({ key: queryKey, data, error: '' });
      })
      .catch((err) => {
        if (!cancelled) setLoaded({ key: queryKey, data: [], error: apiErrorMessage(err, 'Không tải được danh sách sản phẩm') });
      });
    return () => {
      cancelled = true;
    };
  }, [categorySlug, search, brand, sort, price, queryKey]);

  const activeCategory = categories.find((c) => c.slug === categorySlug);
  const title = activeCategory ? activeCategory.name : search ? `Kết quả cho "${search}"` : 'Tất cả sản phẩm';
  useDocumentTitle(title);

  function setParam(key: string, value: string) {
    const next = new URLSearchParams(searchParams);
    if (value && !(key === 'sort' && value === 'newest')) next.set(key, value);
    else next.delete(key);
    setSearchParams(next);
  }

  function clearFilters() {
    setSearchParams({});
  }

  const hasFilters = !!(search || brand || price || sort !== 'newest');

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
            <SearchBox key={search} initial={search} onSubmit={(kw) => setParam('q', kw)} />

            <h6 className="fw-bold mb-2">Hãng</h6>
            <select className="form-select form-select-sm mb-3" value={brand} onChange={(e) => setParam('brand', e.target.value)}>
              <option value="">Tất cả hãng</option>
              {brands.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>

            <h6 className="fw-bold mb-2">Khoảng giá</h6>
            <select className="form-select form-select-sm mb-3" value={price} onChange={(e) => setParam('price', e.target.value)}>
              {PRICE_RANGES.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>

            {hasFilters && (
              <button type="button" className="btn btn-sm btn-outline-secondary w-100 mb-4" onClick={clearFilters}>
                <i className="bi bi-x-circle"></i> Xoá bộ lọc
              </button>
            )}

            <h6 className="fw-bold mb-3">Danh mục</h6>
            <ul className="list-unstyled mb-0">
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
          <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
            <h1 className="fw-bold fs-4 mb-0">
              {title} {!loading && !error && <small className="text-muted fs-6 fw-normal">({products.length} sản phẩm)</small>}
            </h1>
            <select className="form-select form-select-sm" style={{ width: 'auto' }} value={sort} onChange={(e) => setParam('sort', e.target.value)} aria-label="Sắp xếp">
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          {loading ? (
            <p className="text-muted">Đang tải...</p>
          ) : error ? (
            <div className="text-center py-4">
              <p className="text-danger">{error}</p>
              <button className="btn btn-outline-secondary" onClick={() => setReloadKey((k) => k + 1)}>Thử lại</button>
            </div>
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
