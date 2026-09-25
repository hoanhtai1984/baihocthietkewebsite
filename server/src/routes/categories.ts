import { Router } from 'express';
import { prisma } from '../lib/prisma';

const router = Router();

router.get('/', async (_req, res, next) => {
  try {
    const categories = await prisma.category.findMany({ orderBy: { position: 'asc' } });
    res.json(categories);
  } catch (err) {
    next(err);
  }
});

export default router;
