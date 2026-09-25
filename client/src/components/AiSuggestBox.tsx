import { useState } from 'react';
import { Link } from 'react-router-dom';
import { suggestProducts } from '../api/ai';
import { formatMoney } from '../utils/format';

function AiSuggestBox() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError('');
    try {
      const data = await suggestProducts(query.trim());
      setSuggestions(data.suggestions || []);
      setSearched(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không gợi ý được lúc này, thử lại sau');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="border rounded-3 p-3 p-md-4 bg-light mb-4">
      <h2 className="fw-bold fs-5 mb-2">
        <i className="bi bi-stars text-warning"></i> Hỏi AI gợi ý sản phẩm phù hợp
      </h2>
      <form className="d-flex gap-2 flex-column flex-md-row" onSubmit={handleSubmit}>
        <input
          type="text"
          className="form-control"
          placeholder='Ví dụ: "tủ lạnh dưới 10 triệu cho gia đình 4 người"'
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button type="submit" className="btn btn-warning fw-bold" disabled={loading}>
          {loading ? 'Đang tìm...' : 'Gợi ý'}
        </button>
      </form>

      {error && <p className="text-danger small mt-2 mb-0">{error}</p>}

      {searched && !loading && suggestions.length === 0 && !error && (
        <p className="text-muted small mt-2 mb-0">AI không tìm thấy sản phẩm phù hợp.</p>
      )}

      {suggestions.length > 0 && (
        <div className="mt-3 d-flex flex-column gap-2">
          {suggestions.map((s) => (
            <Link
              key={s.product.id}
              to={`/san-pham/${s.product.slug}`}
              className="d-flex align-items-center gap-3 p-2 bg-white border rounded-3 text-decoration-none text-dark"
            >
              <img src={s.product.image} alt={s.product.name} width={56} height={56} style={{ objectFit: 'contain' }} />
              <div className="flex-grow-1">
                <div className="fw-semibold">{s.product.name}</div>
                <div className="text-danger fw-bold small">{formatMoney(s.product.price)}</div>
                <div className="text-muted small">{s.reason}</div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default AiSuggestBox;
