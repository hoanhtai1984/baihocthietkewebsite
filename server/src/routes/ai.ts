import { Router } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { prisma } from '../lib/prisma';
import { logger } from '../lib/logger';
import { keywordSuggest } from '../utils/suggest';

const router = Router();

// Model đổi được qua biến môi trường GEMINI_MODEL (Google hay đổi/ngừng model cũ).
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash';

async function geminiSuggest(query: string, products: any[]) {
  const catalogText = products
    .map((p) => `- id=${p.id} | ${p.name} | hãng ${p.brand} | danh mục ${p.category.name} | giá ${p.price.toLocaleString('vi-VN')}đ | ${p.stock > 0 ? 'còn hàng' : 'hết hàng'}`)
    .join('\n');

  const prompt = `Bạn là trợ lý bán hàng điện máy. Đây là toàn bộ sản phẩm đang có:\n${catalogText}\n\nKhách hỏi: "${query}"\n\nChọn tối đa 5 sản phẩm PHÙ HỢP NHẤT từ danh sách trên (chỉ chọn trong danh sách, ưu tiên còn hàng, không bịa sản phẩm mới). Trả lời DUY NHẤT bằng JSON hợp lệ, không kèm chữ nào khác, đúng định dạng:\n[{"productId": số, "reason": "lý do ngắn 1 câu"}]`;

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);
  const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });
  const result = await model.generateContent(prompt);
  const text = result.response.text();

  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) throw new Error('AI trả kết quả không có JSON');
  const picks: Array<{ productId: number; reason: string }> = JSON.parse(jsonMatch[0]);

  const productMap = new Map(products.map((p) => [p.id, p]));
  return picks
    .map((pick) => {
      const product = productMap.get(Number(pick.productId));
      return product ? { product, reason: String(pick.reason || '') } : null;
    })
    .filter((s): s is { product: any; reason: string } => s !== null)
    .slice(0, 5);
}

router.post('/suggest', async (req, res, next) => {
  try {
    const query = String(req.body?.query || '').trim();
    if (!query) {
      return res.status(400).json({ message: 'Vui lòng nhập câu hỏi' });
    }
    if (query.length > 300) {
      return res.status(400).json({ message: 'Câu hỏi quá dài (tối đa 300 ký tự)' });
    }

    const products = await prisma.product.findMany({
      where: { hidden: false },
      include: { category: true },
    });

    // Có Gemini thì dùng AI; chưa có key hoặc AI lỗi (hết quota, mạng...) thì
    // tự rơi về gợi ý theo từ khoá + ngân sách - khách luôn nhận được kết quả.
    if (process.env.GEMINI_API_KEY) {
      try {
        const suggestions = await geminiSuggest(query, products);
        return res.json({ suggestions, source: 'ai' });
      } catch (err) {
        logger.warn({ err: (err as Error).message }, 'Gemini lỗi - dùng gợi ý theo từ khoá');
      }
    }
    res.json({ suggestions: keywordSuggest(query, products), source: 'keyword' });
  } catch (err) {
    next(err);
  }
});

export default router;
