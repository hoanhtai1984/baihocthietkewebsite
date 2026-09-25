import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getProduct } from '../api/products';
import { formatMoney } from '../utils/format';
import { addItem } from '../utils/cart';
import { showToast } from '../utils/toast';

function ProductDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<any>(null);
  const [notFound, setNotFound] = useState(false);
  const [qty, setQty] = useState(1);

  useEffect(() => {
    if (!slug) return;
    getProduct(slug)
      .then(setProduct)
      .catch(() => setNotFound(true));
  }, [slug]);

  if (notFound) {
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

  const outOfStock = product.stock === 0;
  const discount = product.oldPrice
    ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)
    : 0;

  function handleAddToCart() {
    addItem(product, qty);
    showToast(`Đã thêm "${product.name}" vào giỏ hàng`);
  }

  function handleBuyNow() {
    addItem(product, qty);
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
              <label className="fw-semibold mb-0">Số lượng:</label>
              <input
                type="number"
                min={1}
                max={99}
                className="form-control"
                style={{ width: 90 }}
                value={qty}
                onChange={(e) => setQty(Math.max(1, Math.min(99, Number(e.target.value) || 1)))}
              />
              <span className="text-muted small">Còn {product.stock} sản phẩm</span>
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
    </div>
  );
}

export default ProductDetail;
