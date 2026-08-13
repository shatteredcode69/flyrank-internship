import { Worker } from 'bullmq';
import { createRedisConnection } from '../src/infrastructure/redis/redis-client.js';
import { PUBLISH_QUEUE_NAME, type PublishJobData } from '../src/infrastructure/queue/queue-names.js';
import { processPublishJob } from './processors/publish.processor.js';
import { logger } from '../src/shared/logging/logger.js';
import { SocialPostRepository } from '../src/infrastructure/database/repositories/social-post.repository.js';
import { enqueuePublishJob } from '../src/infrastructure/queue/publish-queue.js';

const socialPostRepo = new SocialPostRepository();

/**
 * §14/§15 of the build spec: durable scheduling + crash recovery.
 *
 * Two independent mechanisms cooperate:
 *  1. BullMQ Worker — the fast path. Consumes delayed jobs from Redis as
 *     they become due. Configured with retry/backoff (see publish-queue.ts)
 *     so a transient failure is retried automatically by BullMQ itself.
 *  2. Recovery sweep — the durable-truth path, run on an interval. Queries
 *     Postgres directly for any SocialPost with status=QUEUED whose
 *     scheduledAt has passed. This catches every failure mode a queue
 *     alone can't: the worker process was down when a job would have
 *     fired, Redis lost the job, or the job was enqueued but the process
 *     crashed before BullMQ's job bookkeeping was durably flushed. The
 *     underlying publish call is idempotent (see publish-social-post.usecase.ts),
 *     so the sweep re-publishing a post the fast path *also* picked up is
 *     always safe — never a duplicate platform post.
 */
const worker = new Worker<PublishJobData>(PUBLISH_QUEUE_NAME, processPublishJob, {
  connection: createRedisConnection(),
  concurrency: 5,
});

worker.on('completed', (job) => {
  logger.info({ jobId: job.id, socialPostId: job.data.socialPostId }, 'Publish job completed');
});

worker.on('failed', (job, err) => {
  logger.error({ jobId: job?.id, socialPostId: job?.data.socialPostId, err }, 'Publish job failed');
});

const RECOVERY_SWEEP_INTERVAL_MS = 15_000;

async function recoverDuePosts(): Promise<void> {
  const due = await socialPostRepo.findDueForPublish(new Date());
  if (due.length === 0) return;

  logger.info({ count: due.length }, 'Recovery sweep found due SocialPosts not yet picked up by the queue');
  for (const post of due) {
    // eslint-disable-next-line no-await-in-loop -- deliberate, low volume, avoids thundering herd
    await enqueuePublishJob(post.id, 0);
  }
}

const sweepHandle = setInterval(() => {
  recoverDuePosts().catch((err: unknown) => logger.error({ err }, 'Recovery sweep failed'));
}, RECOVERY_SWEEP_INTERVAL_MS);

logger.info({ queue: PUBLISH_QUEUE_NAME }, 'Worker started (BullMQ consumer + recovery sweep active)');

async function shutdown(signal: string): Promise<void> {
  logger.info({ signal }, 'Worker shutting down gracefully');
  clearInterval(sweepHandle);
  await worker.close();
  process.exit(0);
}

process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));
