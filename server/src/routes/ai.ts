import { Router } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { prisma } from '../lib/prisma';
import { logger } from '../lib/logger';

const router = Router();

router.post('/suggest', async (req, res, next) => {
  try {
    const { query } = req.body || {};
    if (!query || !String(query).trim()) {
      return res.status(400).json({ message: 'Vui lòng nhập câu hỏi' });
    }
    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({ message: 'Tính năng gợi ý AI chưa được cấu hình' });
    }

    const products = await prisma.product.findMany({
      where: { hidden: false },
      include: { category: true },
    });

    const catalogText = products
      .map((p) => `- id=${p.id} | ${p.name} | hãng ${p.brand} | danh mục ${p.category.name} | giá ${p.price.toLocaleString('vi-VN')}đ`)
      .join('\n');

    const prompt = `Bạn là trợ lý bán hàng điện máy. Đây là toàn bộ sản phẩm đang có:\n${catalogText}\n\nKhách hỏi: "${query}"\n\nChọn tối đa 5 sản phẩm PHÙ HỢP NHẤT từ danh sách trên (chỉ chọn trong danh sách, không bịa sản phẩm mới). Trả lời DUY NHẤT bằng JSON hợp lệ, không kèm chữ nào khác, đúng định dạng:\n[{"productId": số, "reason": "lý do ngắn 1 câu"}]`;

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      logger.warn({ text }, 'AI suggest: no JSON in response');
      return res.status(502).json({ message: 'AI trả kết quả không đọc được, thử lại giúp mình' });
    }

    let picks: Array<{ productId: number; reason: string }>;
    try {
      picks = JSON.parse(jsonMatch[0]);
    } catch {
      return res.status(502).json({ message: 'AI trả kết quả không đọc được, thử lại giúp mình' });
    }

    const productMap = new Map(products.map((p) => [p.id, p]));
    const suggestions = picks
      .map((pick) => {
        const product = productMap.get(Number(pick.productId));
        return product ? { product, reason: pick.reason } : null;
      })
      .filter(Boolean)
      .slice(0, 5);

    res.json({ suggestions });
  } catch (err) {
    logger.error({ err: (err as Error).message }, 'AI suggest failed');
    next(err);
  }
});

export default router;
