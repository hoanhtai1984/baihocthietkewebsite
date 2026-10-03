import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { sendSuccess } from '../utils/apiResponse';
import * as authService from '../services/authService';
import { changePasswordSchema, loginSchema, refreshSchema, registerSchema, updateProfileSchema } from '../schemas/auth';

const router = Router();

// Giới hạn chỉ cho các thao tác dễ bị dò mật khẩu (đăng nhập/đăng ký/đổi mật
// khẩu) - KHÔNG áp cho /me, /refresh vì client gọi tự động thường xuyên.
// Tắt khi chạy test (NODE_ENV=test) để các bài test không tự chặn nhau.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test',
  message: { success: false, message: 'Thử quá nhiều lần, vui lòng đợi 15 phút rồi thử lại' },
});

router.post('/register', authLimiter, validate(registerSchema), async (req, res, next) => {
  try {
    const session = await authService.register(req.body);
    sendSuccess(res, session, { status: 201, message: 'Đăng ký thành công' });
  } catch (err) {
    next(err);
  }
});

router.post('/login', authLimiter, validate(loginSchema), async (req, res, next) => {
  try {
    sendSuccess(res, await authService.login(req.body));
  } catch (err) {
    next(err);
  }
});

// Cấp cặp token mới và XOAY VÒNG refresh token (token cũ không dùng lại được).
router.post('/refresh', validate(refreshSchema), async (req, res, next) => {
  try {
    sendSuccess(res, await authService.refresh(req.body.refreshToken));
  } catch (err) {
    next(err);
  }
});

router.post('/logout', requireAuth, async (req, res, next) => {
  try {
    await authService.logout(req.user!.id);
    sendSuccess(res, null, { message: 'Đã đăng xuất' });
  } catch (err) {
    next(err);
  }
});

router.get('/me', requireAuth, async (req, res, next) => {
  try {
    sendSuccess(res, await authService.getProfile(req.user!.id));
  } catch (err) {
    next(err);
  }
});

router.patch('/me', requireAuth, validate(updateProfileSchema), async (req, res, next) => {
  try {
    sendSuccess(res, await authService.updateProfile(req.user!.id, req.body), { message: 'Đã cập nhật thông tin' });
  } catch (err) {
    next(err);
  }
});

router.post('/change-password', authLimiter, requireAuth, validate(changePasswordSchema), async (req, res, next) => {
  try {
    sendSuccess(res, await authService.changePassword(req.user!.id, req.body), { message: 'Đã đổi mật khẩu' });
  } catch (err) {
    next(err);
  }
});

export default router;
