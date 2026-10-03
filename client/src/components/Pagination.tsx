import type { PaginationMeta } from '../types';

interface Props {
  meta: PaginationMeta;
  onPageChange: (page: number) => void;
}

// Danh sách số trang gọn: luôn có trang đầu/cuối, quanh trang hiện tại 1 trang,
// khoảng bị bỏ qua hiện dấu "…".
function pageList(current: number, total: number): Array<number | 'gap-l' | 'gap-r'> {
  const pages = new Set([1, total, current - 1, current, current + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const result: Array<number | 'gap-l' | 'gap-r'> = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) result.push(i === 1 ? 'gap-l' : 'gap-r');
    result.push(p);
  });
  return result;
}

function Pagination({ meta, onPageChange }: Props) {
  if (meta.totalPages <= 1) return null;
  return (
    <nav aria-label="Phân trang" className="mt-4">
      <ul className="pagination pagination-sm justify-content-center flex-wrap mb-0">
        <li className={`page-item ${meta.hasPrev ? '' : 'disabled'}`}>
          <button type="button" className="page-link" onClick={() => onPageChange(meta.page - 1)} disabled={!meta.hasPrev} aria-label="Trang trước">
            &laquo;
          </button>
        </li>
        {pageList(meta.page, meta.totalPages).map((p) =>
          typeof p === 'number' ? (
            <li key={p} className={`page-item ${p === meta.page ? 'active' : ''}`}>
              <button type="button" className="page-link" onClick={() => onPageChange(p)} aria-current={p === meta.page ? 'page' : undefined}>
                {p}
              </button>
            </li>
          ) : (
            <li key={p} className="page-item disabled">
              <span className="page-link">…</span>
            </li>
          ),
        )}
        <li className={`page-item ${meta.hasNext ? '' : 'disabled'}`}>
          <button type="button" className="page-link" onClick={() => onPageChange(meta.page + 1)} disabled={!meta.hasNext} aria-label="Trang sau">
            &raquo;
          </button>
        </li>
      </ul>
    </nav>
  );
}

export default Pagination;
