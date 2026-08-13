import { Queue } from 'bullmq';
import { createRedisConnection } from '../redis/redis-client.js';
import { PUBLISH_QUEUE_NAME, type PublishJobData } from './queue-names.js';

/**
 * Durable delayed-job queue (§14 of the build spec). Scheduling state lives
 * in Redis (BullMQ) AND in Postgres (SocialPost.scheduledAt) — the worker's
 * recovery sweep (worker/worker.ts) uses the Postgres row as the source of
 * truth, so even a queue that lost a job (or a job enqueued but never
 * consumed before a crash) still gets published via the sweep. Never rely
 * on setTimeout/setInterval as the durable source of scheduling truth.
 */
export const publishQueue = new Queue<PublishJobData>(PUBLISH_QUEUE_NAME, {
  connection: createRedisConnection(),
  defaultJobOptions: {
    attempts: 5,
    backoff: { type: 'exponential', delay: 2000 },
    removeOnComplete: { count: 500 },
    removeOnFail: false, // keep failed jobs visible for debugging/evidence
  },
});

export async function enqueuePublishJob(socialPostId: string, delayMs: number): Promise<void> {
  await publishQueue.add(
    'publish',
    { socialPostId },
    {
      delay: Math.max(0, delayMs),
      jobId: `publish:${socialPostId}`, // BullMQ de-dupes on jobId — a second enqueue for the same post is a no-op
    },
  );
}
