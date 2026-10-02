import { Router } from 'express';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';
import { prisma } from '../lib/prisma';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { logger } from '../lib/logger';
import { requireAuth } from '../middleware/auth';
import { HttpError } from '../utils/httpError';
import { isValidEmail, isValidPhone, requireText } from '../utils/validate';

const router = Router();

// Giới hạn chỉ cho các thao tác dễ bị dò mật khẩu (đăng nhập/đăng ký/đổi mật
// khẩu) - KHÔNG áp cho /me, /refresh vì client gọi tự động thường xuyên.
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: true, legacyHeaders: false });

// Hash giả để so sánh khi email không tồn tại - giữ thời gian phản hồi gần như
// nhau, không lộ email nào đã đăng ký.
const DUMMY_HASH = bcrypt.hashSync('dummy-password-for-timing', 10);

function publicUser(user: { id: number; name: string; email: string; role: string; phone: string | null }) {
  return { id: user.id, name: user.name, email: user.email, role: user.role, phone: user.phone };
}

function issueTokens(user: { id: number; role: 'CUSTOMER' | 'ADMIN' }) {
  const payload = { id: user.id, role: user.role };
  return { accessToken: signAccessToken(payload), refreshToken: signRefreshToken(payload) };
}

router.post('/register', authLimiter, async (req, res, next) => {
  try {
    const { password, phone } = req.body || {};
    const name = requireText(req.body?.name, 'họ tên', 100);
    const email = String(req.body?.email || '').trim().toLowerCase();
    if (!email || !password) {
      return res.status(400).json({ message: 'Thiếu email hoặc mật khẩu' });
    }
    if (!isValidEmail(email)) {
      return res.status(400).json({ message: 'Email không hợp lệ' });
    }
    if (String(password).length < 6) {
      return res.status(400).json({ message: 'Mật khẩu cần ít nhất 6 ký tự' });
    }
    if (phone && !isValidPhone(String(phone))) {
      return res.status(400).json({ message: 'Số điện thoại không hợp lệ' });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ message: 'Email đã được đăng ký' });
    }

    const hashed = await bcrypt.hash(String(password), 10);
    const user = await prisma.user.create({
      data: { name, email, password: hashed, phone: phone ? String(phone).trim() : null },
    });

    logger.info({ userId: user.id }, 'User registered');
    res.status(201).json({ user: publicUser(user), ...issueTokens(user) });
  } catch (err) {
    next(err);
  }
});

router.post('/login', authLimiter, async (req, res, next) => {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const password = String(req.body?.password || '');
    if (!email || !password) {
      return res.status(400).json({ message: 'Thiếu email hoặc mật khẩu' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    const match = await bcrypt.compare(password, user?.password || DUMMY_HASH);
    if (!user || !match) {
      return res.status(401).json({ message: 'Email hoặc mật khẩu không đúng' });
    }

    logger.info({ userId: user.id }, 'User logged in');
    res.json({ user: publicUser(user), ...issueTokens(user) });
  } catch (err) {
    next(err);
  }
});

// Cấp access token mới - đọc lại user trong DB để quyền (role) luôn mới nhất và
// tài khoản đã bị xoá thì không còn refresh được nữa.
router.post('/refresh', async (req, res, next) => {
  try {
    const { refreshToken } = req.body || {};
    if (!refreshToken) {
      return res.status(400).json({ message: 'Thiếu refreshToken' });
    }
    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      return res.status(401).json({ message: 'refreshToken không hợp lệ hoặc đã hết hạn' });
    }
    const user = await prisma.user.findUnique({ where: { id: payload.id } });
    if (!user) {
      return res.status(401).json({ message: 'Tài khoản không còn tồn tại' });
    }
    res.json({ accessToken: signAccessToken({ id: user.id, role: user.role }), user: publicUser(user) });
  } catch (err) {
    next(err);
  }
});

router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!user) return res.status(401).json({ message: 'Tài khoản không còn tồn tại' });
    res.json(publicUser(user));
  } catch (err) {
    next(err);
  }
});

router.patch('/me', requireAuth, async (req, res, next) => {
  try {
    const data: { name?: string; phone?: string | null } = {};
    if (req.body?.name !== undefined) data.name = requireText(req.body.name, 'họ tên', 100);
    if (req.body?.phone !== undefined) {
      const phone = String(req.body.phone || '').trim();
      if (phone && !isValidPhone(phone)) throw new HttpError(400, 'Số điện thoại không hợp lệ');
      data.phone = phone || null;
    }
    const user = await prisma.user.update({ where: { id: req.user!.id }, data });
    res.json(publicUser(user));
  } catch (err) {
    next(err);
  }
});

router.post('/change-password', authLimiter, requireAuth, async (req, res, next) => {
  try {
    const currentPassword = String(req.body?.currentPassword || '');
    const newPassword = String(req.body?.newPassword || '');
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Mật khẩu mới cần ít nhất 6 ký tự' });
    }
    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!user || !(await bcrypt.compare(currentPassword, user.password))) {
      return res.status(400).json({ message: 'Mật khẩu hiện tại không đúng' });
    }
    await prisma.user.update({ where: { id: user.id }, data: { password: await bcrypt.hash(newPassword, 10) } });
    logger.info({ userId: user.id }, 'Password changed');
    res.json({ message: 'Đã đổi mật khẩu' });
  } catch (err) {
    next(err);
  }
});

export default router;
