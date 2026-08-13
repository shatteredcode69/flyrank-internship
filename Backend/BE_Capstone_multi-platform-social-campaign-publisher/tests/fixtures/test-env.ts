/**
 * Shared setup for integration/e2e tests. These tests require a REAL
 * Postgres + Redis + the fake-platform server running — they are designed
 * to run via `docker compose exec api npm test`, matching the "test:"
 * command in capstone.yaml. They are not mocked, per §21's requirement for
 * deterministic INTEGRATION tests against real infra.
 *
 * If DATABASE_URL/REDIS_URL are not reachable (e.g. this exact sandbox,
 * which has no Docker/Postgres/Redis available — see BUILDLOG.md), these
 * suites are skipped rather than reported as false passes.
 */
import { prisma } from '../../src/infrastructure/database/prisma-client.js';

export async function isDatabaseReachable(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}

export async function cleanDatabase(): Promise<void> {
  await prisma.webhookEvent.deleteMany();
  await prisma.idempotencyRecord.deleteMany();
  await prisma.socialPost.deleteMany();
  await prisma.socialAccount.deleteMany();
  await prisma.campaign.deleteMany();
}
