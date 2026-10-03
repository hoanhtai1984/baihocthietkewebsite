import { useEffect, useState } from 'react';
import { adminGetCategories, adminCreateCategory, adminUpdateCategory, adminDeleteCategory } from '../../api/admin';
import { showToast, apiErrorMessage } from '../../utils/toast';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import type { Category } from '../../types';

const EMPTY_FORM = { id: null as number | null, name: '', icon: '', position: '0' };

function AdminCategories() {
  useDocumentTitle('Quản lý danh mục');
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  function load() {
    adminGetCategories()
      .then((data) => {
        setCategories(data);
        setLoadError('');
      })
      .catch((err) => setLoadError(apiErrorMessage(err, 'Không tải được danh mục')))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  function openCreate() {
    setForm(EMPTY_FORM);
    setError('');
    setShowForm(true);
  }

  function openEdit(c: Category) {
    setForm({ id: c.id, name: c.name, icon: c.icon || '', position: String(c.position) });
    setError('');
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const payload = { name: form.name, icon: form.icon || null, position: Number(form.position) || 0 };
    setSaving(true);
    try {
      if (form.id) {
        await adminUpdateCategory(form.id, payload);
        showToast('Đã lưu danh mục');
      } else {
        await adminCreateCategory(payload);
        showToast('Đã tạo danh mục');
      }
      setShowForm(false);
      load();
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(c: Category) {
    const productCount = c._count?.products ?? 0;
    if (productCount > 0) {
      showToast(`Danh mục "${c.name}" còn ${productCount} sản phẩm - hãy chuyển hoặc xoá sản phẩm trước.`, 'error');
      return;
    }
    if (!confirm(`Xoá danh mục "${c.name}"?`)) return;
    try {
      await adminDeleteCategory(c.id);
      showToast('Đã xoá danh mục');
      load();
    } catch (err) {
      showToast(apiErrorMessage(err, 'Không xoá được danh mục'), 'error');
    }
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1 className="fw-bold fs-4 mb-0">Danh mục</h1>
        <button className="btn btn-warning fw-bold" onClick={openCreate}>
          <i className="bi bi-plus-lg"></i> Thêm danh mục
        </button>
      </div>

      {showForm && (
        <form className="border rounded-3 p-3 mb-4" onSubmit={handleSubmit}>
          <div className="row g-2">
            <div className="col-md-5">
              <input className="form-control" placeholder="Tên danh mục" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} maxLength={100} required />
            </div>
            <div className="col-md-5">
              <input className="form-control" placeholder="Icon (vd: bi-tv) - xem icons.getbootstrap.com" value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} />
            </div>
            <div className="col-md-2">
              <input className="form-control" type="number" min={0} placeholder="Thứ tự" value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} />
            </div>
          </div>
          {error && <p className="text-danger small mt-2 mb-0">{error}</p>}
          <div className="d-flex gap-2 mt-3">
            <button type="submit" className="btn btn-warning fw-bold" disabled={saving}>{saving ? 'Đang lưu...' : form.id ? 'Lưu' : 'Tạo danh mục'}</button>
            <button type="button" className="btn btn-outline-secondary" onClick={() => setShowForm(false)}>Huỷ</button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="text-muted">Đang tải...</p>
      ) : loadError ? (
        <p className="text-danger">{loadError}</p>
      ) : (
        <table className="table align-middle">
          <thead>
            <tr>
              <th>Icon</th>
              <th>Tên</th>
              <th>Số sản phẩm</th>
              <th>Thứ tự</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {categories.map((c) => (
              <tr key={c.id}>
                <td><i className={`bi ${c.icon || 'bi-tag'} fs-5`}></i></td>
                <td>{c.name}</td>
                <td>{c._count?.products ?? 0}</td>
                <td>{c.position}</td>
                <td className="text-end">
                  <button className="btn btn-sm btn-outline-primary me-1" onClick={() => openEdit(c)}>Sửa</button>
                  <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(c)}>Xoá</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default AdminCategories;
