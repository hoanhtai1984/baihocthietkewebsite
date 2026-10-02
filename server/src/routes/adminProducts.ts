import { Router } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { requireAdmin } from '../middleware/auth';
import { slugify } from '../utils/slugify';
import { HttpError } from '../utils/httpError';
import { requireText, toInt } from '../utils/validate';

const router = Router();
router.use(requireAdmin);

// specs gửi lên là object { "Tên thông số": "giá trị" } - chỉ giữ cặp chữ-chữ
// không rỗng để dữ liệu rác không lọt vào DB.
function cleanSpecs(specs: unknown): Record<string, string> | null {
  if (!specs || typeof specs !== 'object' || Array.isArray(specs)) return null;
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(specs as Record<string, unknown>)) {
    const k = String(key).trim();
    const v = String(value ?? '').trim();
    if (k && v) result[k] = v;
  }
  return Object.keys(result).length > 0 ? result : null;
}

function checkPrices(price: number, oldPrice: number | null) {
  if (price < 1) throw new HttpError(400, 'Giá bán phải lớn hơn 0');
  if (oldPrice !== null && oldPrice < price) {
    throw new HttpError(400, 'Giá gốc phải lớn hơn hoặc bằng giá bán (hoặc để trống)');
  }
}

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
    const name = requireText(req.body?.name, 'tên sản phẩm', 200);
    const brand = requireText(req.body?.brand, 'hãng', 100);
    const image = requireText(req.body?.image, 'link ảnh', 500);
    const description = requireText(req.body?.description, 'mô tả', 5000);
    const price = toInt(req.body?.price, 'Giá bán', { min: 1 });
    const oldPrice = req.body?.oldPrice ? toInt(req.body.oldPrice, 'Giá gốc', { min: 1 }) : null;
    const stock = toInt(req.body?.stock ?? 0, 'Tồn kho', { max: 1_000_000 });
    const categoryId = toInt(req.body?.categoryId, 'Danh mục', { min: 1 });
    checkPrices(price, oldPrice);

    const category = await prisma.category.findUnique({ where: { id: categoryId } });
    if (!category) throw new HttpError(400, 'Danh mục không tồn tại');

    const product = await prisma.product.create({
      data: {
        name,
        slug: `${slugify(name)}-${Date.now()}`,
        brand,
        price,
        oldPrice,
        image,
        description,
        specs: cleanSpecs(req.body?.specs) ?? undefined,
        stock,
        categoryId,
      },
      include: { category: true },
    });
    res.status(201).json(product);
  } catch (err) {
    next(err);
  }
});

router.patch('/:id', async (req, res, next) => {
  try {
    const id = toInt(req.params.id, 'Mã sản phẩm', { min: 1 });
    const body = req.body || {};
    const current = await prisma.product.findUnique({ where: { id } });
    if (!current) throw new HttpError(404, 'Không tìm thấy sản phẩm');

    const data: Record<string, unknown> = {};
    if (body.name !== undefined) data.name = requireText(body.name, 'tên sản phẩm', 200);
    if (body.brand !== undefined) data.brand = requireText(body.brand, 'hãng', 100);
    if (body.image !== undefined) data.image = requireText(body.image, 'link ảnh', 500);
    if (body.description !== undefined) data.description = requireText(body.description, 'mô tả', 5000);
    if (body.price !== undefined) data.price = toInt(body.price, 'Giá bán', { min: 1 });
    if (body.oldPrice !== undefined) data.oldPrice = body.oldPrice ? toInt(body.oldPrice, 'Giá gốc', { min: 1 }) : null;
    if (body.stock !== undefined) data.stock = toInt(body.stock, 'Tồn kho', { max: 1_000_000 });
    if (body.hidden !== undefined) data.hidden = Boolean(body.hidden);
    if (body.specs !== undefined) data.specs = cleanSpecs(body.specs) ?? null;
    if (body.categoryId !== undefined) {
      const categoryId = toInt(body.categoryId, 'Danh mục', { min: 1 });
      if (!(await prisma.category.findUnique({ where: { id: categoryId } }))) {
        throw new HttpError(400, 'Danh mục không tồn tại');
      }
      data.categoryId = categoryId;
    }

    checkPrices(
      (data.price as number | undefined) ?? current.price,
      data.oldPrice !== undefined ? (data.oldPrice as number | null) : current.oldPrice,
    );

    // Prisma không cho gán null thẳng vào cột Json - phải dùng Prisma.DbNull.
    const product = await prisma.product.update({
      where: { id },
      data: { ...data, ...(data.specs === null && { specs: Prisma.DbNull }) } as any,
      include: { category: true },
    });
    res.json(product);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const id = toInt(req.params.id, 'Mã sản phẩm', { min: 1 });
    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) throw new HttpError(404, 'Không tìm thấy sản phẩm');
    // Sản phẩm đã có trong đơn hàng thì KHÔNG xoá được (mất lịch sử đơn) - gợi
    // ý ẩn sản phẩm thay vì xoá.
    const used = await prisma.orderItem.count({ where: { productId: id } });
    if (used > 0) {
      throw new HttpError(409, `Sản phẩm đã có trong ${used} dòng đơn hàng nên không thể xoá. Hãy bấm "Ẩn" để ngừng bán.`);
    }
    await prisma.product.delete({ where: { id } });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
