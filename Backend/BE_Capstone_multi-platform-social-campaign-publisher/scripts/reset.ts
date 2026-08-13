/** Wipes all application tables (not schema) for a clean local demo re-run. */
import { prisma } from '../src/infrastructure/database/prisma-client.js';

async function main(): Promise<void> {
  await prisma.$transaction([
    prisma.webhookEvent.deleteMany(),
    prisma.idempotencyRecord.deleteMany(),
    prisma.socialPost.deleteMany(),
    prisma.socialAccount.deleteMany(),
    prisma.campaign.deleteMany(),
  ]);
  // eslint-disable-next-line no-console
  console.log('All application tables truncated.');
}

main()
  .catch((err: unknown) => {
    // eslint-disable-next-line no-console
    console.error('Reset failed:', err);
    process.exitCode = 1;
  })
  .finally(() => void prisma.$disconnect());
