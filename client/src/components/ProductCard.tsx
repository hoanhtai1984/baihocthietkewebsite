import { Link, useNavigate } from 'react-router-dom';
import { formatMoney } from '../utils/format';
import { addItem } from '../utils/cart';
import { showToast } from '../utils/toast';

interface Product {
  id: number;
  slug: string;
  name: string;
  brand: string;
  price: number;
  oldPrice?: number | null;
  image: string;
  stock: number;
}

function ProductCard({ product }: { product: Product }) {
  const navigate = useNavigate();
  const outOfStock = product.stock === 0;
  const discount = product.oldPrice
    ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)
    : 0;

  function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault();
    addItem(product, 1);
    showToast(`Đã thêm "${product.name}" vào giỏ hàng`);
  }

  function handleBuyNow(e: React.MouseEvent) {
    e.preventDefault();
    addItem(product, 1);
    navigate('/gio-hang');
  }

  return (
    <div className="product-card bg-white border rounded-3 p-0">
      {discount > 0 && <span className="badge-discount">-{discount}%</span>}
      {outOfStock && <span className="badge-outofstock">Hết hàng</span>}
      <div className={`product-img${outOfStock ? ' out-of-stock' : ''}`}>
        <Link to={`/san-pham/${product.slug}`}>
          <img src={product.image} alt={product.name} width={400} height={400} loading="lazy" />
        </Link>
      </div>
      <div className="product-info product-info-cq px-3 pt-2 pb-2">
        <span className="product-brand text-muted small">{product.brand}</span>
        <p className="mb-0">
          <Link to={`/san-pham/${product.slug}`} className="product-title text-truncate-2 fs-6 h5">
            {product.name}
          </Link>
        </p>
        <div className="product-price mb-2">
          <span className="current-price text-danger fw-bold">{formatMoney(product.price)}</span>
          {discount > 0 && <span className="old-price">{formatMoney(product.oldPrice)}</span>}
        </div>
        <div className="d-flex flex-column gap-1">
          <button className="btn btn-warning w-100 fw-bold btn-sm" onClick={handleBuyNow} disabled={outOfStock}>
            {outOfStock ? 'Hết hàng' : 'Mua ngay'}
          </button>
          <button
            className="btn btn-outline-primary w-100 fw-bold add-to-cart-btn btn-sm"
            onClick={handleAddToCart}
            disabled={outOfStock}
          >
            <i className="bi bi-cart-plus"></i> Thêm vào giỏ
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProductCard;
