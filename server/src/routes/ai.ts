import { Router } from 'express';
import { validate } from '../middleware/validate';
import { sendSuccess } from '../utils/apiResponse';
import { suggestSchema } from '../schemas/ai';
import { suggestProducts } from '../services/aiService';

const router = Router();

router.post('/suggest', validate(suggestSchema), async (req, res, next) => {
  try {
    sendSuccess(res, await suggestProducts(req.body.query));
  } catch (err) {
    next(err);
  }
});

export default router;
