import { GoogleGenerativeAI } from '@google/generative-ai';
import { prisma } from '../lib/prisma';
import { logger } from '../lib/logger';
import { keywordSuggest, type Suggestion } from '../utils/suggest';

type CatalogProduct = Awaited<ReturnType<typeof loadCatalog>>[number];

export interface SuggestResult {
  suggestions: Suggestion<CatalogProduct>[];
  source: 'ai' | 'keyword';
}

function loadCatalog() {
  return prisma.product.findMany({ where: { hidden: false }, include: { category: true } });
}

// Model đổi được qua biến môi trường GEMINI_MODEL (Google hay đổi/ngừng model cũ).
async function geminiSuggest(query: string, products: CatalogProduct[]): Promise<Suggestion<CatalogProduct>[]> {
  const catalogText = products
    .map(
      (p) =>
        `- id=${p.id} | ${p.name} | hãng ${p.brand} | danh mục ${p.category.name} | giá ${p.price.toLocaleString('vi-VN')}đ | ${p.stock > 0 ? 'còn hàng' : 'hết hàng'}`,
    )
    .join('\n');

  const prompt = `Bạn là trợ lý bán hàng điện máy. Đây là toàn bộ sản phẩm đang có:\n${catalogText}\n\nKhách hỏi: "${query}"\n\nChọn tối đa 5 sản phẩm PHÙ HỢP NHẤT từ danh sách trên (chỉ chọn trong danh sách, ưu tiên còn hàng, không bịa sản phẩm mới). Trả lời DUY NHẤT bằng JSON hợp lệ, không kèm chữ nào khác, đúng định dạng:\n[{"productId": số, "reason": "lý do ngắn 1 câu"}]`;

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);
  const model = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL || 'gemini-2.0-flash' });
  const result = await model.generateContent(prompt);
  const jsonMatch = result.response.text().match(/\[[\s\S]*\]/);
  if (!jsonMatch) throw new Error('AI trả kết quả không có JSON');
  const picks = JSON.parse(jsonMatch[0]) as Array<{ productId: number; reason?: string }>;

  const productMap = new Map(products.map((p) => [p.id, p]));
  // Chỉ nhận sản phẩm CÓ THẬT trong catalog - bỏ id AI tự bịa ra.
  return picks
    .map((pick) => {
      const product = productMap.get(Number(pick.productId));
      return product ? { product, reason: String(pick.reason || '') } : null;
    })
    .filter((s): s is Suggestion<CatalogProduct> => s !== null)
    .slice(0, 5);
}

// Có Gemini thì dùng AI; chưa có key hoặc AI lỗi (hết quota, mạng...) thì tự
// rơi về gợi ý theo từ khoá + ngân sách - khách luôn nhận được kết quả.
export async function suggestProducts(query: string): Promise<SuggestResult> {
  const products = await loadCatalog();
  if (process.env.GEMINI_API_KEY) {
    try {
      return { suggestions: await geminiSuggest(query, products), source: 'ai' };
    } catch (err) {
      logger.warn({ err: (err as Error).message }, 'Gemini lỗi - dùng gợi ý theo từ khoá');
    }
  }
  return { suggestions: keywordSuggest(query, products), source: 'keyword' };
}
