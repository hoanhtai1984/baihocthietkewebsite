import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

import { requestLogger } from './middleware/requestLogger';
import { logger } from './lib/logger';

import authRoutes from './routes/auth';
import categoryRoutes from './routes/categories';
import productRoutes from './routes/products';
import orderRoutes from './routes/orders';
import aiRoutes from './routes/ai';
import adminProductRoutes from './routes/adminProducts';
import adminCategoryRoutes from './routes/adminCategories';
import adminOrderRoutes from './routes/adminOrders';

const app = express();

app.set('trust proxy', 1);
app.use(helmet());
app.use(
  cors({
    origin: process.env.FE_URL || 'http://localhost:5173',
    credentials: true,
  }),
);
app.use(express.json());
app.use(requestLogger);

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: true, legacyHeaders: false });
const aiLimiter = rateLimit({ windowMs: 60 * 1000, limit: 10, standardHeaders: true, legacyHeaders: false });

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/ai', aiLimiter, aiRoutes);
app.use('/api/admin/products', adminProductRoutes);
app.use('/api/admin/categories', adminCategoryRoutes);
app.use('/api/admin/orders', adminOrderRoutes);

app.use((_req: Request, res: Response) => {
  res.status(404).json({ message: 'Không tìm thấy route' });
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
  logger.error({ err: err.message, path: req.path }, 'Unhandled error');
  res.status(err.status || 500).json({ message: err.message || 'Lỗi máy chủ' });
});

export default app;
