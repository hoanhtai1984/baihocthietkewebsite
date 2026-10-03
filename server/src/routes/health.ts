import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { logger } from '../lib/logger';

const router = Router();

// Health check cho Render/UptimeRobot: ping thật tới DB. DB chết thì trả 503
// "unhealthy" để nền tảng deploy biết app KHÔNG phục vụ được, thay vì báo ok giả.
router.get('/', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
      version: process.env.npm_package_version ?? 'unknown',
      database: 'connected',
    });
  } catch (err) {
    logger.error({ err: (err as Error).message }, 'Health check: database unreachable');
    res.status(503).json({ status: 'unhealthy', database: 'disconnected' });
  }
});

export default router;
