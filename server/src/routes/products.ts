import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { normalizeText } from '../utils/text';

const router = Router();

const SORTS: Record<string, any> = {
  newest: { createdAt: 'desc' },
  'price-asc': { price: 'asc' },
  'price-desc': { price: 'desc' },
  'name-asc': { name: 'asc' },
};

// GET /api/products?category=&search=&brand=&minPrice=&maxPrice=&sort=
// Tìm kiếm KHÔNG phân biệt dấu ("dieu hoa" ra "Điều Hòa") theo tên + hãng.
router.get('/', async (req, res, next) => {
  try {
    const { category, search, brand, minPrice, maxPrice, sort } = req.query;
    const where: any = { hidden: false };
    if (category) where.category = { slug: String(category) };
    if (brand) where.brand = { equals: String(brand), mode: 'insensitive' };

    const price: { gte?: number; lte?: number } = {};
    if (minPrice !== undefined && minPrice !== '' && Number.isFinite(Number(minPrice))) price.gte = Number(minPrice);
    if (maxPrice !== undefined && maxPrice !== '' && Number.isFinite(Number(maxPrice))) price.lte = Number(maxPrice);
    if (price.gte !== undefined || price.lte !== undefined) where.price = price;

    let products = await prisma.product.findMany({
      where,
      include: { category: true },
      orderBy: SORTS[String(sort)] || SORTS.newest,
    });

    const keyword = normalizeText(String(search || ''));
    if (keyword) {
      products = products.filter((p) => normalizeText(`${p.name} ${p.brand}`).includes(keyword));
    }
    res.json(products);
  } catch (err) {
    next(err);
  }
});

// Danh sách hãng đang có (dùng cho bộ lọc) - khai báo TRƯỚC '/:slug' để
// "brands" không bị hiểu nhầm là slug sản phẩm.
router.get('/brands', async (req, res, next) => {
  try {
    const where: any = { hidden: false };
    if (req.query.category) where.category = { slug: String(req.query.category) };
    const rows = await prisma.product.findMany({ where, select: { brand: true }, distinct: ['brand'], orderBy: { brand: 'asc' } });
    res.json(rows.map((r) => r.brand));
  } catch (err) {
    next(err);
  }
});

router.get('/:slug', async (req, res, next) => {
  try {
    const product = await prisma.product.findUnique({
      where: { slug: req.params.slug },
      include: { category: true },
    });
    if (!product || product.hidden) {
      return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
    }
    res.json(product);
  } catch (err) {
    next(err);
  }
});

export default router;
