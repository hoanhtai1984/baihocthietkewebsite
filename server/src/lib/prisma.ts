import { PrismaClient } from '@prisma/client';

// Production không log query (có thể chứa dữ liệu khách hàng). Muốn xem SQL
// thật Prisma đang chạy lúc dev: đặt PRISMA_LOG_QUERIES=true trong server/.env.
const logQueries = process.env.NODE_ENV === 'development' && process.env.PRISMA_LOG_QUERIES === 'true';

export const prisma = new PrismaClient({
  log: logQueries ? ['query', 'warn', 'error'] : ['warn', 'error'],
});
