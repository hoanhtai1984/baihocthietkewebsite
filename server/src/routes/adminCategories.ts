import { Router } from 'express';
import { requireAdmin } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { sendSuccess } from '../utils/apiResponse';
import { idParamSchema } from '../schemas/common';
import { createCategorySchema, updateCategorySchema } from '../schemas/category';
import * as categoryService from '../services/categoryService';

const router = Router();
router.use(requireAdmin);

router.get('/', async (_req, res, next) => {
  try {
    sendSuccess(res, await categoryService.adminListCategories());
  } catch (err) {
    next(err);
  }
});

router.post('/', validate(createCategorySchema), async (req, res, next) => {
  try {
    sendSuccess(res, await categoryService.createCategory(req.body), { status: 201, message: 'Đã tạo danh mục' });
  } catch (err) {
    next(err);
  }
});

router.patch('/:id', validate(idParamSchema, 'params'), validate(updateCategorySchema), async (req, res, next) => {
  try {
    const { id } = res.locals.params as { id: number };
    sendSuccess(res, await categoryService.updateCategory(id, req.body), { message: 'Đã lưu danh mục' });
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', validate(idParamSchema, 'params'), async (_req, res, next) => {
  try {
    await categoryService.deleteCategory((res.locals.params as { id: number }).id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
