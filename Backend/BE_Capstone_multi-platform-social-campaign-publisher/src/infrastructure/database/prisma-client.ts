import { PrismaClient } from '@prisma/client';
import { env } from '../../config/env.js';

/**
 * Single shared Prisma client. In tests, a dedicated test database URL
 * should be supplied via DATABASE_URL — see docs/testing.md.
 */
export const prisma = new PrismaClient({
  log: env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
});

export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
}
