import { Router } from 'express';
import { requireAdmin } from '../middleware/auth';
import { sendSuccess } from '../utils/apiResponse';
import { getDashboardStats } from '../services/statsService';

const router = Router();
router.use(requireAdmin);

router.get('/', async (_req, res, next) => {
  try {
    sendSuccess(res, await getDashboardStats());
  } catch (err) {
    next(err);
  }
});

export default router;
