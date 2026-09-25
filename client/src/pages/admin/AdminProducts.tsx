import { useEffect, useState } from 'react';
import { adminGetProducts, adminCreateProduct, adminUpdateProduct, adminDeleteProduct } from '../../api/admin';
import { getCategories } from '../../api/categories';
import { formatMoney } from '../../utils/format';

const EMPTY_FORM = {
  id: null as number | null,
  name: '',
  brand: '',
  price: '',
  oldPrice: '',
  image: '',
  description: '',
  stock: '',
  categoryId: '',
};

function AdminProducts() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');

  function load() {
    adminGetProducts().then(setProducts);
    getCategories().then(setCategories);
  }

  useEffect(load, []);

  function openCreate() {
    setForm(EMPTY_FORM);
    setError('');
    setShowForm(true);
  }

  function openEdit(p: any) {
    setForm({
      id: p.id,
      name: p.name,
      brand: p.brand,
      price: String(p.price),
      oldPrice: p.oldPrice ? String(p.oldPrice) : '',
      image: p.image,
      description: p.description,
      stock: String(p.stock),
      categoryId: String(p.categoryId),
    });
    setError('');
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const payload = {
      name: form.name,
      brand: form.brand,
      price: Number(form.price),
      oldPrice: form.oldPrice ? Number(form.oldPrice) : null,
      image: form.image,
      description: form.description,
      stock: Number(form.stock) || 0,
      categoryId: Number(form.categoryId),
    };
    try {
      if (form.id) {
        await adminUpdateProduct(form.id, payload);
      } else {
        await adminCreateProduct(payload);
      }
      setShowForm(false);
      load();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra');
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Xoá sản phẩm này?')) return;
    await adminDeleteProduct(id);
    load();
  }

  async function handleToggleHidden(p: any) {
    await adminUpdateProduct(p.id, { hidden: !p.hidden });
    load();
  }

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
          <div className="row g-2">
            <div className="col-md-6">
              <input className="form-control" placeholder="Tên sản phẩm" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div className="col-md-6">
              <input className="form-control" placeholder="Hãng" value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} required />
            </div>
            <div className="col-md-3">
              <input className="form-control" type="number" placeholder="Giá bán" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
            </div>
            <div className="col-md-3">
              <input className="form-control" type="number" placeholder="Giá gốc (không bắt buộc)" value={form.oldPrice} onChange={(e) => setForm({ ...form, oldPrice: e.target.value })} />
            </div>
            <div className="col-md-3">
              <input className="form-control" type="number" placeholder="Tồn kho" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} required />
            </div>
            <div className="col-md-3">
              <select className="form-select" value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} required>
                <option value="">-- Danh mục --</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="col-12">
              <input className="form-control" placeholder="Link ảnh (URL)" value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} required />
            </div>
            <div className="col-12">
              <textarea className="form-control" placeholder="Mô tả" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
            </div>
          </div>
          {error && <p className="text-danger small mt-2">{error}</p>}
          <div className="d-flex gap-2 mt-3">
            <button type="submit" className="btn btn-warning fw-bold">{form.id ? 'Lưu' : 'Tạo sản phẩm'}</button>
            <button type="button" className="btn btn-outline-secondary" onClick={() => setShowForm(false)}>Huỷ</button>
          </div>
        </form>
      )}

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
            {products.map((p) => (
              <tr key={p.id}>
                <td><img src={p.image} alt={p.name} width={48} height={48} style={{ objectFit: 'contain' }} /></td>
                <td>{p.name}</td>
                <td>{p.category?.name}</td>
                <td>{formatMoney(p.price)}</td>
                <td>{p.stock}</td>
                <td>
                  <span className={`badge ${p.hidden ? 'bg-secondary' : 'bg-success'}`}>
                    {p.hidden ? 'Đã ẩn' : 'Đang bán'}
                  </span>
                </td>
                <td className="text-end">
                  <button className="btn btn-sm btn-outline-secondary me-1" onClick={() => handleToggleHidden(p)}>
                    {p.hidden ? 'Hiện' : 'Ẩn'}
                  </button>
                  <button className="btn btn-sm btn-outline-primary me-1" onClick={() => openEdit(p)}>Sửa</button>
                  <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(p.id)}>Xoá</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AdminProducts;
