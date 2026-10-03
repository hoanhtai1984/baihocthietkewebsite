import { prisma } from '../lib/prisma';
import { AppError } from '../utils/appError';
import { slugify } from '../utils/slugify';

export function listCategories() {
  return prisma.category.findMany({ orderBy: { position: 'asc' } });
}

// Danh sách cho trang quản trị: kèm số sản phẩm mỗi danh mục (kể cả đang ẩn).
export function adminListCategories() {
  return prisma.category.findMany({
    orderBy: { position: 'asc' },
    include: { _count: { select: { products: true } } },
  });
}

export async function createCategory(input: { name: string; icon?: string | null; position?: number }) {
  const slug = slugify(input.name);
  if (!slug) throw new AppError(400, 'Tên danh mục cần có chữ cái hoặc chữ số');
  if (await prisma.category.findUnique({ where: { slug } })) {
    throw new AppError(409, 'Đã có danh mục có tên tương tự');
  }
  return prisma.category.create({
    data: { name: input.name, slug, icon: input.icon || null, position: input.position ?? 0 },
  });
}

// Slug giữ nguyên khi đổi tên để link /danh-muc/<slug> đã chia sẻ không bị gãy.
export function updateCategory(id: number, input: { name?: string; icon?: string | null; position?: number }) {
  return prisma.category.update({ where: { id }, data: input });
}

export async function deleteCategory(id: number) {
  const category = await prisma.category.findUnique({ where: { id }, include: { _count: { select: { products: true } } } });
  if (!category) throw new AppError(404, 'Không tìm thấy danh mục');
  if (category._count.products > 0) {
    throw new AppError(409, `Danh mục còn ${category._count.products} sản phẩm - hãy chuyển hoặc xoá sản phẩm trước`);
  }
  await prisma.category.delete({ where: { id } });
}
