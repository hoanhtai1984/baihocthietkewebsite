import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { Prisma } from '@prisma/client';

import { requestLogger } from './middleware/requestLogger';
import { logger } from './lib/logger';
import { HttpError } from './utils/httpError';

import authRoutes from './routes/auth';
import categoryRoutes from './routes/categories';
import productRoutes from './routes/products';
import orderRoutes from './routes/orders';
import aiRoutes from './routes/ai';
import adminProductRoutes from './routes/adminProducts';
import adminCategoryRoutes from './routes/adminCategories';
import adminOrderRoutes from './routes/adminOrders';
import adminStatsRoutes from './routes/adminStats';

const app = express();

app.set('trust proxy', 1);
app.use(helmet());

// FE_URL có thể là nhiều địa chỉ ngăn cách bằng dấu phẩy (vd bản deploy +
// localhost để thử) - chỉ các origin này mới được gọi API từ trình duyệt.
const allowedOrigins = (process.env.FE_URL || 'http://localhost:5173')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json({ limit: '100kb' }));
app.use(requestLogger);

const aiLimiter = rateLimit({ windowMs: 60 * 1000, limit: 10, standardHeaders: true, legacyHeaders: false });

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/ai', aiLimiter, aiRoutes);
app.use('/api/admin/products', adminProductRoutes);
app.use('/api/admin/categories', adminCategoryRoutes);
app.use('/api/admin/orders', adminOrderRoutes);
app.use('/api/admin/stats', adminStatsRoutes);

app.use((_req: Request, res: Response) => {
  res.status(404).json({ message: 'Không tìm thấy route' });
});

// Đổi lỗi kỹ thuật (Prisma, JSON hỏng...) thành thông báo tiếng Việt gọn gàng -
// KHÔNG trả nguyên văn lỗi Prisma cho client (có cả đường dẫn file + câu SQL).
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ message: err.message });
  }
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2025') return res.status(404).json({ message: 'Không tìm thấy dữ liệu' });
    if (err.code === 'P2002') return res.status(409).json({ message: 'Dữ liệu bị trùng (đã tồn tại)' });
    if (err.code === 'P2003') {
      return res.status(409).json({ message: 'Dữ liệu đang được sử dụng ở nơi khác nên không thể thực hiện' });
    }
  }
  if (err?.type === 'entity.parse.failed') {
    return res.status(400).json({ message: 'Dữ liệu gửi lên không phải JSON hợp lệ' });
  }
  if (err?.type === 'entity.too.large') {
    return res.status(413).json({ message: 'Dữ liệu gửi lên quá lớn' });
  }
  logger.error({ err: err?.message, path: req.path }, 'Unhandled error');
  res.status(500).json({ message: 'Lỗi máy chủ, vui lòng thử lại sau' });
});

export default app;
