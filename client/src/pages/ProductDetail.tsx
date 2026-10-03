import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getProduct, getProducts } from '../api/products';
import { formatMoney } from '../utils/format';
import { addItem } from '../utils/cart';
import { showToast } from '../utils/toast';
import ProductCard from '../components/ProductCard';
import useDocumentTitle from '../hooks/useDocumentTitle';
import type { Product } from '../types';

function ProductDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  // Gắn dữ liệu với slug đã tải: slug trên URL khác slug đã tải = đang tải. Nhờ vậy
  // chuyển giữa 2 sản phẩm (bấm vào sản phẩm liên quan) không còn hiện nhầm sản phẩm cũ.
  const [state, setState] = useState<{ slug: string; product: Product | null; related: Product[] } | null>(null);
  const [qty, setQty] = useState(1);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    getProduct(slug)
      .then(async (product) => {
        const related = await getProducts({ category: product.category.slug })
          .then(({ items }) => items.filter((p) => p.id !== product.id).slice(0, 4))
          .catch(() => []);
        if (cancelled) return;
        setQty(1);
        setState({ slug, product, related });
      })
      .catch(() => {
        if (!cancelled) setState({ slug, product: null, related: [] });
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const loaded = state?.slug === slug ? state : null;
  const product = loaded?.product ?? null;
  useDocumentTitle(product?.name || (loaded ? 'Không tìm thấy sản phẩm' : undefined));

  if (loaded && !product) {
    return (
      <div className="container py-5 text-center">
        <h1 className="fw-bold fs-3">Không tìm thấy sản phẩm</h1>
        <Link to="/danh-muc" className="btn btn-warning fw-bold mt-3">Xem tất cả sản phẩm</Link>
      </div>
    );
  }

  if (!product) {
    return <div className="container py-5 text-center text-muted">Đang tải...</div>;
  }

  // product đã chắc chắn không null ở các hàm bên dưới (đã return sớm phía trên)
  const current: Product = product;
  const outOfStock = product.stock <= 0;
  const maxQty = Math.min(99, product.stock);
  const discount = product.oldPrice
    ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)
    : 0;

  function handleAddToCart(): boolean {
    const result = addItem(current, qty);
    if (result.added <= 0) {
      showToast(`Giỏ hàng đã có tối đa ${result.limit} sản phẩm này (hết số lượng còn lại).`, 'error');
      return false;
    }
    if (result.capped) {
      showToast(`Chỉ thêm được ${result.added} - giỏ hàng đã đạt tối đa ${result.limit} sản phẩm này.`, 'error');
    } else {
      showToast(`Đã thêm "${current.name}" vào giỏ hàng`);
    }
    return true;
  }

  function handleBuyNow() {
    // "Mua ngay" vẫn sang giỏ hàng kể cả khi giỏ đã đủ số lượng tối đa của sản phẩm này.
    addItem(current, qty);
    navigate('/gio-hang');
  }

  return (
    <div className="container py-4">
      <nav aria-label="breadcrumb" className="mb-3">
        <ol className="breadcrumb m-0">
          <li className="breadcrumb-item"><Link to="/">Trang chủ</Link></li>
          <li className="breadcrumb-item">
            <Link to={`/danh-muc/${product.category.slug}`}>{product.category.name}</Link>
          </li>
          <li className="breadcrumb-item active text-truncate">{product.name}</li>
        </ol>
      </nav>

      <div className="row g-4">
        <div className="col-md-5">
          <div className="border rounded-3 p-3 text-center">
            <img src={product.image} alt={product.name} className="img-fluid" style={{ maxHeight: 360, objectFit: 'contain' }} />
          </div>
        </div>
        <div className="col-md-7">
          <span className="badge bg-warning-subtle text-warning-emphasis fw-bold mb-2">{product.brand}</span>
          <h1 className="fw-bold fs-3 mb-2">{product.name}</h1>
          <div className="d-flex align-items-center gap-3 mb-3">
            <span className="text-danger fw-bold fs-3">{formatMoney(product.price)}</span>
            {discount > 0 && (
              <>
                <span className="text-muted text-decoration-line-through">{formatMoney(product.oldPrice)}</span>
                <span className="badge bg-danger">-{discount}%</span>
              </>
            )}
          </div>

          {product.specs && Object.keys(product.specs).length > 0 && (
            <table className="table table-sm table-borderless mb-3">
              <tbody>
                {Object.entries(product.specs).map(([key, value]) => (
                  <tr key={key}>
                    <td className="text-muted" style={{ width: '40%' }}>{key}</td>
                    <td className="fw-semibold">{String(value)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <p className="mb-3">{product.description}</p>

          {outOfStock ? (
            <span className="badge bg-secondary fs-6">Hết hàng</span>
          ) : (
            <div className="d-flex align-items-center gap-3 mb-3">
              <label className="fw-semibold mb-0" htmlFor="qty">Số lượng:</label>
              <input
                id="qty"
                type="number"
                min={1}
                max={maxQty}
                className="form-control"
                style={{ width: 90 }}
                value={qty}
                onChange={(e) => setQty(Math.max(1, Math.min(maxQty, Number(e.target.value) || 1)))}
              />
              <span className={`small ${product.stock <= 5 ? 'text-danger fw-semibold' : 'text-muted'}`}>
                {product.stock <= 5 ? `Chỉ còn ${product.stock} sản phẩm` : `Còn ${product.stock} sản phẩm`}
              </span>
            </div>
          )}

          <div className="d-flex gap-2">
            <button className="btn btn-warning fw-bold px-4" onClick={handleBuyNow} disabled={outOfStock}>
              Mua ngay
            </button>
            <button className="btn btn-outline-primary fw-bold px-4" onClick={handleAddToCart} disabled={outOfStock}>
              <i className="bi bi-cart-plus"></i> Thêm vào giỏ
            </button>
          </div>
        </div>
      </div>

      {loaded && loaded.related.length > 0 && (
        <section className="mt-5">
          <h2 className="fw-bold fs-4 mb-3">Sản phẩm cùng danh mục</h2>
          <div className="row row-cols-2 row-cols-md-4 g-3">
            {loaded.related.map((p) => (
              <div className="col" key={p.id}>
                <ProductCard product={p} />
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

export default ProductDetail;
