import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { requireAdmin } from '../middleware/auth';
import { slugify } from '../utils/slugify';

const router = Router();
router.use(requireAdmin);

router.post('/', async (req, res, next) => {
  try {
    const { name, icon, position } = req.body || {};
    if (!name) {
      return res.status(400).json({ message: 'Thiếu tên danh mục' });
    }
    const category = await prisma.category.create({
      data: { name, slug: slugify(name), icon: icon || null, position: Number(position) || 0 },
    });
    res.status(201).json(category);
  } catch (err) {
    next(err);
  }
});

router.patch('/:id', async (req, res, next) => {
  try {
    const { name, icon, position } = req.body || {};
    const category = await prisma.category.update({
      where: { id: Number(req.params.id) },
      data: {
        ...(name !== undefined && { name }),
        ...(icon !== undefined && { icon }),
        ...(position !== undefined && { position: Number(position) }),
      },
    });
    res.json(category);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    await prisma.category.delete({ where: { id: Number(req.params.id) } });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
