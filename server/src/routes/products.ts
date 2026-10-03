import { Router } from 'express';
import { validate } from '../middleware/validate';
import { sendSuccess } from '../utils/apiResponse';
import { productQuerySchema } from '../schemas/product';
import { getProductBySlug, listBrands, listProducts, type ProductListQuery } from '../services/productService';

const router = Router();

// GET /products?category=&search=&brand=&minPrice=&maxPrice=&sort=&page=&limit=
router.get('/', validate(productQuerySchema, 'query'), async (_req, res, next) => {
  try {
    const { products, meta } = await listProducts(res.locals.query as ProductListQuery);
    sendSuccess(res, products, { meta });
  } catch (err) {
    next(err);
  }
});

// Danh sách hãng đang có (dùng cho bộ lọc) - khai báo TRƯỚC '/:slug' để
// "brands" không bị hiểu nhầm là slug sản phẩm.
router.get('/brands', async (req, res, next) => {
  try {
    const category = typeof req.query.category === 'string' ? req.query.category : undefined;
    sendSuccess(res, await listBrands(category));
  } catch (err) {
    next(err);
  }
});

router.get('/:slug', async (req, res, next) => {
  try {
    sendSuccess(res, await getProductBySlug(req.params.slug));
  } catch (err) {
    next(err);
  }
});

export default router;
