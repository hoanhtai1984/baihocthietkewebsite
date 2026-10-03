import { Router } from 'express';
import { sendSuccess } from '../utils/apiResponse';
import { listCategories } from '../services/categoryService';

const router = Router();

router.get('/', async (_req, res, next) => {
  try {
    sendSuccess(res, await listCategories());
  } catch (err) {
    next(err);
  }
});

export default router;
