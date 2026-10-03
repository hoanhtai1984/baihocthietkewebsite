import { Router } from 'express';
import { requireAdmin } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { sendSuccess } from '../utils/apiResponse';
import { idParamSchema } from '../schemas/common';
import { adminProductQuerySchema, createProductSchema, updateProductSchema } from '../schemas/product';
import * as productService from '../services/productService';

const router = Router();
router.use(requireAdmin);

router.get('/', validate(adminProductQuerySchema, 'query'), async (_req, res, next) => {
  try {
    const { products, meta } = await productService.adminListProducts(res.locals.query as productService.AdminProductQuery);
    sendSuccess(res, products, { meta });
  } catch (err) {
    next(err);
  }
});

router.post('/', validate(createProductSchema), async (req, res, next) => {
  try {
    sendSuccess(res, await productService.createProduct(req.body), { status: 201, message: 'Đã tạo sản phẩm' });
  } catch (err) {
    next(err);
  }
});

router.patch('/:id', validate(idParamSchema, 'params'), validate(updateProductSchema), async (req, res, next) => {
  try {
    const { id } = res.locals.params as { id: number };
    sendSuccess(res, await productService.updateProduct(id, req.body), { message: 'Đã lưu sản phẩm' });
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', validate(idParamSchema, 'params'), async (_req, res, next) => {
  try {
    await productService.deleteProduct((res.locals.params as { id: number }).id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
