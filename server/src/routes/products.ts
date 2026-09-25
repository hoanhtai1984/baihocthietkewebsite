import { Router } from 'express';
import { prisma } from '../lib/prisma';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const { category, search } = req.query;
    const where: any = { hidden: false };
    if (category) {
      where.category = { slug: String(category) };
    }
    if (search) {
      where.name = { contains: String(search), mode: 'insensitive' };
    }
    const products = await prisma.product.findMany({
      where,
      include: { category: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(products);
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
