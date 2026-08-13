import type { Request, Response } from 'express';
import { prisma } from '../../../infrastructure/database/prisma-client.js';
import { createRedisConnection } from '../../../infrastructure/redis/redis-client.js';

/**
 * Verifies the infra it depends on rather than just returning 200
 * unconditionally (§19). Failures are reported per-dependency so an
 * operator can see exactly what's down.
 */
export async function healthHandler(_req: Request, res: Response): Promise<void> {
  const checks: Record<string, 'ok' | 'error'> = { database: 'error', redis: 'error' };

  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = 'ok';
  } catch {
    checks.database = 'error';
  }

  try {
    const redis = createRedisConnection();
    await redis.ping();
    await redis.quit();
    checks.redis = 'ok';
  } catch {
    checks.redis = 'error';
  }

  const healthy = Object.values(checks).every((v) => v === 'ok');
  res.status(healthy ? 200 : 503).json({ status: healthy ? 'ok' : 'degraded', checks });
}
