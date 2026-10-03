import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { AppError } from '../utils/appError';
import { normalizeText } from '../utils/text';
import { slugify } from '../utils/slugify';
import { buildMeta, parsePagination, type PaginationMeta } from '../utils/pagination';

export const LOW_STOCK_THRESHOLD = 5;

const ORDER_BY: Record<string, Prisma.ProductOrderByWithRelationInput> = {
  newest: { createdAt: 'desc' },
  'price-asc': { price: 'asc' },
  'price-desc': { price: 'desc' },
  'name-asc': { name: 'asc' },
};

// Danh sách chỉ lấy field cần hiển thị (không kéo mô tả dài/thông số) - tránh over-fetching.
const LIST_SELECT = {
  id: true,
  name: true,
  slug: true,
  brand: true,
  price: true,
  oldPrice: true,
  image: true,
  stock: true,
  category: { select: { id: true, name: true, slug: true } },
} satisfies Prisma.ProductSelect;

export interface ProductListQuery {
  category?: string;
  search?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: string;
  page?: number;
  limit?: number;
}

// GET /products - lọc theo danh mục/hãng/giá, sắp xếp, phân trang.
// Tìm kiếm KHÔNG phân biệt dấu ("dieu hoa" ra "Điều Hòa"): Postgres mặc định
// không có unaccent nên khi có từ khoá thì lọc ở tầng ứng dụng rồi mới phân
// trang (catalog nhỏ nên vẫn nhanh); không có từ khoá thì phân trang ngay trong DB.
export async function listProducts(query: ProductListQuery) {
  const { page, limit, skip } = parsePagination(query);
  const where: Prisma.ProductWhereInput = { hidden: false };
  if (query.category) where.category = { slug: query.category };
  if (query.brand) where.brand = { equals: query.brand, mode: 'insensitive' };
  if (query.minPrice !== undefined || query.maxPrice !== undefined) {
    where.price = {
      ...(query.minPrice !== undefined && { gte: query.minPrice }),
      ...(query.maxPrice !== undefined && { lte: query.maxPrice }),
    };
  }
  const orderBy = ORDER_BY[query.sort || 'newest'] || ORDER_BY.newest;

  const keyword = normalizeText(query.search || '');
  if (keyword) {
    const all = await prisma.product.findMany({ where, select: LIST_SELECT, orderBy });
    const matched = all.filter((p) => normalizeText(`${p.name} ${p.brand}`).includes(keyword));
    return { products: matched.slice(skip, skip + limit), meta: buildMeta(matched.length, page, limit) };
  }

  const [total, products] = await prisma.$transaction([
    prisma.product.count({ where }),
    prisma.product.findMany({ where, select: LIST_SELECT, orderBy, skip, take: limit }),
  ]);
  return { products, meta: buildMeta(total, page, limit) };
}

export async function listBrands(categorySlug?: string) {
  const where: Prisma.ProductWhereInput = { hidden: false };
  if (categorySlug) where.category = { slug: categorySlug };
  const rows = await prisma.product.findMany({ where, select: { brand: true }, distinct: ['brand'], orderBy: { brand: 'asc' } });
  return rows.map((r) => r.brand);
}

export async function getProductBySlug(slug: string) {
  const product = await prisma.product.findUnique({ where: { slug }, include: { category: true } });
  if (!product || product.hidden) throw new AppError(404, 'Không tìm thấy sản phẩm');
  return product;
}

// ---------- Quản trị ----------

export interface AdminProductQuery {
  search?: string;
  categoryId?: number;
  status?: 'active' | 'hidden' | 'low';
  page?: number;
  limit?: number;
}

export async function adminListProducts(query: AdminProductQuery) {
  const { page, limit, skip } = parsePagination(query, { defaultLimit: 10, maxLimit: 100 });
  const where: Prisma.ProductWhereInput = {};
  if (query.categoryId) where.categoryId = query.categoryId;
  if (query.status === 'active') where.hidden = false;
  if (query.status === 'hidden') where.hidden = true;
  if (query.status === 'low') where.stock = { lte: LOW_STOCK_THRESHOLD };
  if (query.search) {
    where.OR = [
      { name: { contains: query.search, mode: 'insensitive' } },
      { brand: { contains: query.search, mode: 'insensitive' } },
    ];
  }
  const [total, products] = await prisma.$transaction([
    prisma.product.count({ where }),
    prisma.product.findMany({ where, include: { category: true }, orderBy: { createdAt: 'desc' }, skip, take: limit }),
  ]);
  return { products, meta: buildMeta(total, page, limit) satisfies PaginationMeta };
}

export interface ProductInput {
  name: string;
  brand: string;
  image: string;
  description: string;
  price: number;
  oldPrice?: number | null;
  stock?: number;
  categoryId: number;
  hidden?: boolean;
  specs?: Record<string, string> | null;
}

// Giá gốc (nếu có) phải >= giá bán - nếu không "% giảm" hiển thị sẽ âm.
function assertPrices(price: number, oldPrice: number | null | undefined) {
  if (oldPrice != null && oldPrice < price) {
    throw new AppError(400, 'Giá gốc phải lớn hơn hoặc bằng giá bán (hoặc để trống)');
  }
}

async function assertCategoryExists(categoryId: number) {
  if (!(await prisma.category.findUnique({ where: { id: categoryId } }))) {
    throw new AppError(400, 'Danh mục không tồn tại');
  }
}

export async function createProduct(input: ProductInput) {
  assertPrices(input.price, input.oldPrice);
  await assertCategoryExists(input.categoryId);
  return prisma.product.create({
    data: {
      name: input.name,
      slug: `${slugify(input.name)}-${Date.now()}`,
      brand: input.brand,
      price: input.price,
      oldPrice: input.oldPrice ?? null,
      image: input.image,
      description: input.description,
      specs: input.specs ?? undefined,
      stock: input.stock ?? 0,
      categoryId: input.categoryId,
    },
    include: { category: true },
  });
}

export async function updateProduct(id: number, input: Partial<ProductInput>) {
  const current = await prisma.product.findUnique({ where: { id } });
  if (!current) throw new AppError(404, 'Không tìm thấy sản phẩm');

  const { specs, ...rest } = input;
  assertPrices(rest.price ?? current.price, rest.oldPrice !== undefined ? rest.oldPrice : current.oldPrice);
  if (rest.categoryId !== undefined) await assertCategoryExists(rest.categoryId);

  return prisma.product.update({
    where: { id },
    data: {
      ...rest,
      // Prisma không cho gán null thẳng vào cột Json - xoá thông số phải dùng Prisma.DbNull.
      ...(specs !== undefined && { specs: specs === null ? Prisma.DbNull : specs }),
    },
    include: { category: true },
  });
}

// Sản phẩm đã có trong đơn hàng thì KHÔNG xoá được (mất lịch sử đơn) - gợi ý ẩn.
export async function deleteProduct(id: number) {
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) throw new AppError(404, 'Không tìm thấy sản phẩm');
  const used = await prisma.orderItem.count({ where: { productId: id } });
  if (used > 0) {
    throw new AppError(409, `Sản phẩm đã có trong ${used} dòng đơn hàng nên không thể xoá. Hãy bấm "Ẩn" để ngừng bán.`);
  }
  await prisma.product.delete({ where: { id } });
}
