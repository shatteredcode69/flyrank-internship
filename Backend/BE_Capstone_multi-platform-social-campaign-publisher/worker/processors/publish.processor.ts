import type { Job } from 'bullmq';
import type { PublishJobData } from '../../src/infrastructure/queue/queue-names.js';
import { publishSocialPost } from '../../src/application/publishing/publish-social-post.usecase.js';
import { logger } from '../../src/shared/logging/logger.js';

/**
 * The actual work performed for each BullMQ job. Delegates entirely to the
 * same publishSocialPost use case the HTTP publish endpoint calls — there
 * is exactly one idempotent-publish code path, not one for "scheduled" and
 * a different one for "manual".
 */
export async function processPublishJob(job: Job<PublishJobData>): Promise<void> {
  logger.info({ jobId: job.id, socialPostId: job.data.socialPostId, attempt: job.attemptsMade + 1 }, 'Processing publish job');
  await publishSocialPost(job.data.socialPostId);
}
