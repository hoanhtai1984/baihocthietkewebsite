import 'dotenv/config';

import app from './app';
import { logger } from './lib/logger';

// Thiếu biến môi trường bắt buộc thì dừng ngay với thông báo rõ ràng, thay vì
// chạy lên rồi lỗi khó hiểu lúc đăng nhập (JWT secret undefined) hoặc truy vấn.
const REQUIRED_ENV = ['DATABASE_URL', 'JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET'];
const missing = REQUIRED_ENV.filter((name) => !process.env[name]);
if (missing.length > 0) {
  logger.error({ missing }, 'Thiếu biến môi trường bắt buộc - kiểm tra file server/.env');
  process.exit(1);
}

const port = Number(process.env.PORT) || 4000;

app.listen(port, () => {
  logger.info({ port }, 'Server started');
});
