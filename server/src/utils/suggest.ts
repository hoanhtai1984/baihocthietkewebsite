import { normalizeText } from './text';

interface SuggestProduct {
  id: number;
  name: string;
  brand: string;
  price: number;
  stock: number;
  category: { name: string };
}

export interface Suggestion<T> {
  product: T;
  reason: string;
}

const STOPWORDS = new Set([
  'toi', 'minh', 'can', 'muon', 'mua', 'tim', 'cho', 'gia', 'dinh', 'nguoi', 'co', 'khong', 'loai', 'nao',
  'tot', 'nhat', 'nen', 'cua', 'va', 'la', 'mot', 'cai', 'gi', 'duoi', 'tren', 'khoang', 'tam', 'tu', 'den',
  'trieu', 'tr', 'trieu', 'nghin', 'k', 'vnd', 'dong', 'ban', 'shop', 'xin', 'goi', 'y', 'san', 'pham',
]);

// Đọc ngân sách từ câu hỏi: "dưới 10 triệu", "trên 5tr", "khoảng 8 triệu",
// "từ 5 đến 10 triệu". Trả về {min,max} bằng đồng (VND); thiếu thì để undefined.
export function parseBudget(query: string): { min?: number; max?: number } {
  const text = normalizeText(query).replace(/,/g, '.');
  const unit = (n: string, u: string) => {
    const value = Number(n);
    if (!Number.isFinite(value)) return undefined;
    if (u.startsWith('tr')) return Math.round(value * 1_000_000);
    if (u === 'k' || u.startsWith('nghin')) return Math.round(value * 1_000);
    return Math.round(value);
  };
  const range = text.match(/tu\s*(\d+(?:\.\d+)?)\s*(trieu|tr|k|nghin)?\s*(?:den|-)\s*(\d+(?:\.\d+)?)\s*(trieu|tr|k|nghin)/);
  if (range) {
    const u2 = range[4];
    const min = unit(range[1], range[2] || u2);
    const max = unit(range[3], u2);
    return { min, max };
  }
  const below = text.match(/(?:duoi|toi da|khong qua|<)\s*(\d+(?:\.\d+)?)\s*(trieu|tr|k|nghin)/);
  if (below) return { max: unit(below[1], below[2]) };
  const above = text.match(/(?:tren|tu|toi thieu|>)\s*(\d+(?:\.\d+)?)\s*(trieu|tr|k|nghin)/);
  if (above) return { min: unit(above[1], above[2]) };
  const around = text.match(/(?:khoang|tam|co)\s*(\d+(?:\.\d+)?)\s*(trieu|tr)/);
  if (around) {
    const center = unit(around[1], around[2]);
    if (center) return { min: Math.round(center * 0.8), max: Math.round(center * 1.2) };
  }
  return {};
}

// Gợi ý dự phòng KHÔNG cần AI: tách từ khoá + ngân sách rồi chấm điểm khớp
// với tên/hãng/danh mục. Dùng khi chưa cấu hình Gemini hoặc Gemini lỗi, để
// ô "Hỏi AI" vẫn trả kết quả hữu ích thay vì báo lỗi.
export function keywordSuggest<T extends SuggestProduct>(query: string, products: T[]): Suggestion<T>[] {
  const budget = parseBudget(query);
  const tokens = normalizeText(query)
    .replace(/[^a-z0-9\s.]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length >= 2 && !STOPWORDS.has(t) && !/^\d+(\.\d+)?$/.test(t));

  const scored = products
    .filter((p) => p.stock > 0)
    .filter((p) => (budget.min === undefined || p.price >= budget.min) && (budget.max === undefined || p.price <= budget.max))
    .map((product) => {
      const nameText = normalizeText(product.name);
      const brandText = normalizeText(product.brand);
      const categoryText = normalizeText(product.category.name);
      const matched: string[] = [];
      let score = 0;
      for (const token of tokens) {
        if (nameText.includes(token)) {
          score += 3;
          matched.push(token);
        } else if (brandText.includes(token)) {
          score += 3;
          matched.push(token);
        } else if (categoryText.includes(token)) {
          score += 2;
          matched.push(token);
        }
      }
      return { product, score, matched };
    });

  // Có từ khoá mà không món nào khớp thì trả rỗng (đừng gợi ý bừa); chỉ có
  // ngân sách (không từ khoá) thì lấy mọi món trong tầm giá.
  const candidates = tokens.length > 0 ? scored.filter((s) => s.score > 0) : scored;

  return candidates
    .sort((a, b) => b.score - a.score || a.product.price - b.product.price)
    .slice(0, 5)
    .map(({ product, matched }) => {
      const parts: string[] = [];
      if (matched.length > 0) parts.push(`khớp "${[...new Set(matched)].join(', ')}"`);
      parts.push(`danh mục ${product.category.name}`);
      if (budget.max !== undefined) parts.push(`trong ngân sách dưới ${Math.round(budget.max / 1_000_000 * 10) / 10} triệu`);
      else if (budget.min !== undefined) parts.push(`từ ${Math.round(budget.min / 1_000_000 * 10) / 10} triệu`);
      return { product, reason: `Gợi ý theo từ khoá: ${parts.join(', ')}.` };
    });
}
