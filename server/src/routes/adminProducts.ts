import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { requireAdmin } from '../middleware/auth';
import { slugify } from '../utils/slugify';

const router = Router();
router.use(requireAdmin);

router.get('/', async (_req, res, next) => {
  try {
    const products = await prisma.product.findMany({
      include: { category: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(products);
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { name, brand, price, oldPrice, image, description, specs, stock, categoryId } = req.body || {};
    if (!name || !brand || !price || !image || !description || !categoryId) {
      return res.status(400).json({ message: 'Thiếu thông tin bắt buộc' });
    }
    const product = await prisma.product.create({
      data: {
        name,
        slug: `${slugify(name)}-${Date.now()}`,
        brand,
        price: Number(price),
        oldPrice: oldPrice ? Number(oldPrice) : null,
        image,
        description,
        specs: specs || undefined,
        stock: Number(stock) || 0,
        categoryId: Number(categoryId),
      },
    });
    res.status(201).json(product);
  } catch (err) {
    next(err);
  }
});

router.patch('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { name, brand, price, oldPrice, image, description, specs, stock, categoryId, hidden } = req.body || {};
    const product = await prisma.product.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(brand !== undefined && { brand }),
        ...(price !== undefined && { price: Number(price) }),
        ...(oldPrice !== undefined && { oldPrice: oldPrice === null ? null : Number(oldPrice) }),
        ...(image !== undefined && { image }),
        ...(description !== undefined && { description }),
        ...(specs !== undefined && { specs }),
        ...(stock !== undefined && { stock: Number(stock) }),
        ...(categoryId !== undefined && { categoryId: Number(categoryId) }),
        ...(hidden !== undefined && { hidden: Boolean(hidden) }),
      },
    });
    res.json(product);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    await prisma.product.delete({ where: { id: Number(req.params.id) } });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
