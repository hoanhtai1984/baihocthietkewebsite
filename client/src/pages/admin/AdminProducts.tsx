import { useCallback, useEffect, useState } from 'react';
import { adminGetProducts, adminCreateProduct, adminUpdateProduct, adminDeleteProduct, type ProductInput } from '../../api/admin';
import { getCategories } from '../../api/categories';
import { formatMoney } from '../../utils/format';
import { showToast, apiErrorMessage } from '../../utils/toast';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import Pagination from '../../components/Pagination';
import type { Category, PaginationMeta, Product } from '../../types';

const EMPTY_FORM = {
  id: null as number | null,
  name: '',
  brand: '',
  price: '',
  oldPrice: '',
  image: '',
  description: '',
  specs: '',
  stock: '',
  categoryId: '',
};

// Thông số nhập dạng mỗi dòng "Tên: giá trị" <-> object lưu trong DB.
function specsToText(specs: Record<string, unknown> | null | undefined) {
  return specs ? Object.entries(specs).map(([k, v]) => `${k}: ${v}`).join('\n') : '';
}

function textToSpecs(text: string) {
  const specs: Record<string, string> = {};
  for (const line of text.split('\n')) {
    const index = line.indexOf(':');
    if (index <= 0) continue;
    const key = line.slice(0, index).trim();
    const value = line.slice(index + 1).trim();
    if (key && value) specs[key] = value;
  }
  return specs;
}

function AdminProducts() {
  useDocumentTitle('Quản lý sản phẩm');
  const [products, setProducts] = useState<Product[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [page, setPage] = useState(1);
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState<'' | 'active' | 'hidden' | 'low'>('');

  // Gõ tìm kiếm: đợi 300ms rồi mới gọi server (lọc + phân trang ở server).
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    getCategories().then(setCategories).catch(() => setCategories([]));
  }, []);

  const load = useCallback(() => {
    return adminGetProducts({
      search: debouncedSearch || undefined,
      categoryId: filterCategory ? Number(filterCategory) : undefined,
      status: filterStatus || undefined,
      page,
    })
      .then(({ items, meta: m }) => {
        // Xoá sản phẩm cuối của trang cuối -> lùi về trang trước
        if (items.length === 0 && m.page > 1 && m.totalPages > 0) {
          setPage(m.totalPages);
          return;
        }
        setProducts(items);
        setMeta(m);
        setLoadError('');
      })
      .catch((err) => setLoadError(apiErrorMessage(err, 'Không tải được sản phẩm')))
      .finally(() => setLoading(false));
  }, [debouncedSearch, filterCategory, filterStatus, page]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  const visible = products;

  function openCreate() {
    setForm(EMPTY_FORM);
    setError('');
    setShowForm(true);
  }

  function openEdit(p: Product) {
    setForm({
      id: p.id,
      name: p.name,
      brand: p.brand,
      price: String(p.price),
      oldPrice: p.oldPrice ? String(p.oldPrice) : '',
      image: p.image,
      description: p.description || '',
      specs: specsToText(p.specs),
      stock: String(p.stock),
      categoryId: String(p.categoryId ?? p.category.id),
    });
    setError('');
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const payload: ProductInput = {
      name: form.name,
      brand: form.brand,
      price: Number(form.price),
      oldPrice: form.oldPrice ? Number(form.oldPrice) : null,
      image: form.image,
      description: form.description,
      specs: textToSpecs(form.specs),
      stock: Number(form.stock) || 0,
      categoryId: Number(form.categoryId),
    };
    setSaving(true);
    try {
      if (form.id) {
        await adminUpdateProduct(form.id, payload);
        showToast('Đã lưu sản phẩm');
      } else {
        await adminCreateProduct(payload);
        showToast('Đã tạo sản phẩm');
      }
      setShowForm(false);
      load();
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(p: Product) {
    if (!confirm(`Xoá sản phẩm "${p.name}"?`)) return;
    try {
      await adminDeleteProduct(p.id);
      showToast('Đã xoá sản phẩm');
      load();
    } catch (err) {
      showToast(apiErrorMessage(err, 'Không xoá được sản phẩm'), 'error');
    }
  }

  async function handleToggleHidden(p: Product) {
    try {
      await adminUpdateProduct(p.id, { hidden: !p.hidden });
      load();
    } catch (err) {
      showToast(apiErrorMessage(err), 'error');
    }
  }

  const set = (key: keyof typeof EMPTY_FORM) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm({ ...form, [key]: e.target.value });

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1 className="fw-bold fs-4 mb-0">Sản phẩm</h1>
        <button className="btn btn-warning fw-bold" onClick={openCreate}>
          <i className="bi bi-plus-lg"></i> Thêm sản phẩm
        </button>
      </div>

      {showForm && (
        <form className="border rounded-3 p-3 mb-4" onSubmit={handleSubmit}>
          <h2 className="fs-5 fw-bold mb-3">{form.id ? 'Sửa sản phẩm' : 'Thêm sản phẩm mới'}</h2>
          <div className="row g-2">
            <div className="col-md-6">
              <input className="form-control" placeholder="Tên sản phẩm" value={form.name} onChange={set('name')} maxLength={200} required />
            </div>
            <div className="col-md-6">
              <input className="form-control" placeholder="Hãng" value={form.brand} onChange={set('brand')} maxLength={100} required />
            </div>
            <div className="col-md-3">
              <input className="form-control" type="number" min={1} placeholder="Giá bán" value={form.price} onChange={set('price')} required />
            </div>
            <div className="col-md-3">
              <input className="form-control" type="number" min={1} placeholder="Giá gốc (không bắt buộc)" value={form.oldPrice} onChange={set('oldPrice')} />
            </div>
            <div className="col-md-3">
              <input className="form-control" type="number" min={0} placeholder="Tồn kho" value={form.stock} onChange={set('stock')} required />
            </div>
            <div className="col-md-3">
              <select className="form-select" value={form.categoryId} onChange={set('categoryId')} required>
                <option value="">-- Danh mục --</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="col-md-10">
              <input className="form-control" placeholder="Link ảnh (URL)" value={form.image} onChange={set('image')} required />
            </div>
            <div className="col-md-2 text-center">
              {form.image && <img src={form.image} alt="Xem trước" height={38} style={{ objectFit: 'contain', maxWidth: '100%' }} onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')} />}
            </div>
            <div className="col-12">
              <textarea className="form-control" placeholder="Mô tả" rows={2} value={form.description} onChange={set('description')} required />
            </div>
            <div className="col-12">
              <textarea
                className="form-control"
                placeholder={'Thông số kỹ thuật - mỗi dòng 1 thông số dạng "Tên: giá trị", ví dụ:\nDung tích: 380L\nBảo hành: 24 tháng'}
                rows={4}
                value={form.specs}
                onChange={set('specs')}
              />
            </div>
          </div>
          {error && <p className="text-danger small mt-2 mb-0">{error}</p>}
          <div className="d-flex gap-2 mt-3">
            <button type="submit" className="btn btn-warning fw-bold" disabled={saving}>
              {saving ? 'Đang lưu...' : form.id ? 'Lưu' : 'Tạo sản phẩm'}
            </button>
            <button type="button" className="btn btn-outline-secondary" onClick={() => setShowForm(false)}>Huỷ</button>
          </div>
        </form>
      )}

      <div className="row g-2 mb-3">
        <div className="col-md-5">
          <input className="form-control form-control-sm" placeholder="Tìm theo tên hoặc hãng..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="col-6 col-md-3">
          <select className="form-select form-select-sm" value={filterCategory} onChange={(e) => { setFilterCategory(e.target.value); setPage(1); }}>
            <option value="">Mọi danh mục</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div className="col-6 col-md-4">
          <select className="form-select form-select-sm" value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value as typeof filterStatus); setPage(1); }}>
            <option value="">Mọi trạng thái</option>
            <option value="active">Đang bán</option>
            <option value="hidden">Đã ẩn</option>
            <option value="low">Sắp hết hàng (≤ 5)</option>
          </select>
        </div>
      </div>

      {loading ? (
        <p className="text-muted">Đang tải...</p>
      ) : loadError ? (
        <p className="text-danger">{loadError}</p>
      ) : (
        <div className="table-responsive">
          <table className="table align-middle">
            <thead>
              <tr>
                <th>Ảnh</th>
                <th>Tên</th>
                <th>Danh mục</th>
                <th>Giá</th>
                <th>Tồn kho</th>
                <th>Trạng thái</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {visible.length === 0 && (
                <tr><td colSpan={7} className="text-center text-muted py-4">Không có sản phẩm nào phù hợp.</td></tr>
              )}
              {visible.map((p) => (
                <tr key={p.id}>
                  <td><img src={p.image} alt={p.name} width={48} height={48} style={{ objectFit: 'contain' }} /></td>
                  <td>{p.name}<div className="text-muted small">{p.brand}</div></td>
                  <td>{p.category?.name}</td>
                  <td>{formatMoney(p.price)}</td>
                  <td>
                    <span className={p.stock === 0 ? 'text-danger fw-bold' : p.stock <= 5 ? 'text-warning-emphasis fw-bold' : ''}>{p.stock}</span>
                  </td>
                  <td>
                    <span className={`badge ${p.hidden ? 'bg-secondary' : 'bg-success'}`}>
                      {p.hidden ? 'Đã ẩn' : 'Đang bán'}
                    </span>
                  </td>
                  <td className="text-end text-nowrap">
                    <button className="btn btn-sm btn-outline-secondary me-1" onClick={() => handleToggleHidden(p)}>
                      {p.hidden ? 'Hiện' : 'Ẩn'}
                    </button>
                    <button className="btn btn-sm btn-outline-primary me-1" onClick={() => openEdit(p)}>Sửa</button>
                    <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(p)}>Xoá</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {meta && <Pagination meta={meta} onPageChange={(p) => { setLoading(true); setPage(p); }} />}
        </div>
      )}
    </div>
  );
}

export default AdminProducts;
