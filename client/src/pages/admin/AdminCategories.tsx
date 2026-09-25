import { useEffect, useState } from 'react';
import { getCategories } from '../../api/categories';
import { adminCreateCategory, adminUpdateCategory, adminDeleteCategory } from '../../api/admin';

const EMPTY_FORM = { id: null as number | null, name: '', icon: '', position: '0' };

function AdminCategories() {
  const [categories, setCategories] = useState<any[]>([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');

  function load() {
    getCategories().then(setCategories);
  }

  useEffect(load, []);

  function openCreate() {
    setForm(EMPTY_FORM);
    setError('');
    setShowForm(true);
  }

  function openEdit(c: any) {
    setForm({ id: c.id, name: c.name, icon: c.icon || '', position: String(c.position) });
    setError('');
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const payload = { name: form.name, icon: form.icon || null, position: Number(form.position) || 0 };
    try {
      if (form.id) {
        await adminUpdateCategory(form.id, payload);
      } else {
        await adminCreateCategory(payload);
      }
      setShowForm(false);
      load();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra');
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Xoá danh mục này? (chỉ xoá được nếu không còn sản phẩm nào)')) return;
    try {
      await adminDeleteCategory(id);
      load();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Không xoá được danh mục (có thể còn sản phẩm)');
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
              <input className="form-control" placeholder="Tên danh mục" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div className="col-md-5">
              <input className="form-control" placeholder="Icon (vd: bi-tv) - xem bootstrap-icons.com" value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} />
            </div>
            <div className="col-md-2">
              <input className="form-control" type="number" placeholder="Thứ tự" value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} />
            </div>
          </div>
          {error && <p className="text-danger small mt-2">{error}</p>}
          <div className="d-flex gap-2 mt-3">
            <button type="submit" className="btn btn-warning fw-bold">{form.id ? 'Lưu' : 'Tạo danh mục'}</button>
            <button type="button" className="btn btn-outline-secondary" onClick={() => setShowForm(false)}>Huỷ</button>
          </div>
        </form>
      )}

      <table className="table align-middle">
        <thead>
          <tr>
            <th>Icon</th>
            <th>Tên</th>
            <th>Thứ tự</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {categories.map((c) => (
            <tr key={c.id}>
              <td><i className={`bi ${c.icon || 'bi-tag'} fs-5`}></i></td>
              <td>{c.name}</td>
              <td>{c.position}</td>
              <td className="text-end">
                <button className="btn btn-sm btn-outline-primary me-1" onClick={() => openEdit(c)}>Sửa</button>
                <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(c.id)}>Xoá</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default AdminCategories;
