import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

import { requestLogger } from './middleware/requestLogger';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

import authRoutes from './routes/auth';
import categoryRoutes from './routes/categories';
import productRoutes from './routes/products';
import orderRoutes from './routes/orders';
import aiRoutes from './routes/ai';
import adminProductRoutes from './routes/adminProducts';
import adminCategoryRoutes from './routes/adminCategories';
import adminOrderRoutes from './routes/adminOrders';
import adminStatsRoutes from './routes/adminStats';
import healthRoutes from './routes/health';

const app = express();

app.set('trust proxy', 1);
app.use(helmet());

// FE_URL có thể là nhiều địa chỉ ngăn cách bằng dấu phẩy (vd bản deploy +
// localhost để thử) - chỉ các origin này mới được gọi API từ trình duyệt.
const allowedOrigins = (process.env.FE_URL || 'http://localhost:5173')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);
app.use(
  cors({
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  }),
);
app.use(express.json({ limit: '100kb' }));
app.use(requestLogger);

const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test',
  message: { success: false, message: 'Bạn hỏi AI quá nhanh, vui lòng thử lại sau ít phút' },
});

// Health check cho nền tảng deploy (ping DB thật)
app.use('/health', healthRoutes);

// API đánh version /api/v1 (chuẩn bài RESTful API Design); giữ thêm tiền tố /api
// cũ để bản client đã build trước đây không bị gãy.
const api = express.Router();
api.use('/health', healthRoutes);
api.use('/auth', authRoutes);
api.use('/categories', categoryRoutes);
api.use('/products', productRoutes);
api.use('/orders', orderRoutes);
api.use('/ai', aiLimiter, aiRoutes);
api.use('/admin/products', adminProductRoutes);
api.use('/admin/categories', adminCategoryRoutes);
api.use('/admin/orders', adminOrderRoutes);
api.use('/admin/stats', adminStatsRoutes);
app.use('/api/v1', api);
app.use('/api', api);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
