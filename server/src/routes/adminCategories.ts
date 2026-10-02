import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { requireAdmin } from '../middleware/auth';
import { slugify } from '../utils/slugify';
import { HttpError } from '../utils/httpError';
import { requireText, toInt } from '../utils/validate';

const router = Router();
router.use(requireAdmin);

// Danh sách cho trang quản trị: kèm số sản phẩm mỗi danh mục (kể cả đang ẩn).
router.get('/', async (_req, res, next) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { position: 'asc' },
      include: { _count: { select: { products: true } } },
    });
    res.json(categories);
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const name = requireText(req.body?.name, 'tên danh mục', 100);
    const slug = slugify(name);
    if (!slug) throw new HttpError(400, 'Tên danh mục cần có chữ cái hoặc chữ số');
    if (await prisma.category.findUnique({ where: { slug } })) {
      throw new HttpError(409, 'Đã có danh mục có tên tương tự');
    }
    const category = await prisma.category.create({
      data: {
        name,
        slug,
        icon: req.body?.icon ? String(req.body.icon).trim() : null,
        position: toInt(req.body?.position ?? 0, 'Thứ tự', { max: 10_000 }),
      },
    });
    res.status(201).json(category);
  } catch (err) {
    next(err);
  }
});

router.patch('/:id', async (req, res, next) => {
  try {
    const id = toInt(req.params.id, 'Mã danh mục', { min: 1 });
    const body = req.body || {};
    const data: { name?: string; icon?: string | null; position?: number } = {};
    if (body.name !== undefined) data.name = requireText(body.name, 'tên danh mục', 100);
    if (body.icon !== undefined) data.icon = body.icon ? String(body.icon).trim() : null;
    if (body.position !== undefined) data.position = toInt(body.position, 'Thứ tự', { max: 10_000 });
    // Slug giữ nguyên khi đổi tên để link /danh-muc/<slug> đã chia sẻ không bị gãy.
    const category = await prisma.category.update({ where: { id }, data });
    res.json(category);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const id = toInt(req.params.id, 'Mã danh mục', { min: 1 });
    const category = await prisma.category.findUnique({ where: { id }, include: { _count: { select: { products: true } } } });
    if (!category) throw new HttpError(404, 'Không tìm thấy danh mục');
    if (category._count.products > 0) {
      throw new HttpError(409, `Danh mục còn ${category._count.products} sản phẩm - hãy chuyển hoặc xoá sản phẩm trước`);
    }
    await prisma.category.delete({ where: { id } });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
