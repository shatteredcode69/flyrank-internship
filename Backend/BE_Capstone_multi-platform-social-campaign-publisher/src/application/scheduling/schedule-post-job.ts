import { CampaignRepository } from '../../infrastructure/database/repositories/campaign.repository.js';
import { CampaignErrors } from '../../domain/campaign/campaign.errors.js';
import { enqueuePublishJob } from '../../infrastructure/queue/publish-queue.js';
import { prisma } from '../../infrastructure/database/prisma-client.js';
import { logger } from '../../shared/logging/logger.js';

const campaignRepo = new CampaignRepository();

export interface ScheduleCampaignInput {
  campaignId: string;
  scheduledAt: Date;
}

/**
 * Persists scheduledAt on every SocialPost (the durable source of truth)
 * AND enqueues a delayed BullMQ job (the fast path). If the queue loses
 * the job or a worker was down at enqueue time, the worker's periodic
 * recovery sweep (worker/worker.ts) still finds and publishes the post
 * from the Postgres row — see docs/reliability.md.
 */
export async function scheduleCampaign(input: ScheduleCampaignInput) {
  if (input.scheduledAt.getTime() <= Date.now()) {
    throw CampaignErrors.scheduledAtInPast();
  }

  const campaign = await campaignRepo.findByIdWithPosts(input.campaignId);
  if (!campaign) throw CampaignErrors.notFound(input.campaignId);
  if (campaign.status !== 'DRAFT') throw CampaignErrors.alreadyScheduled(input.campaignId);

  await prisma.$transaction([
    prisma.campaign.update({
      where: { id: campaign.id },
      data: { status: 'SCHEDULED', scheduledAt: input.scheduledAt },
    }),
    ...campaign.socialPosts.map((post) =>
      prisma.socialPost.update({
        where: { id: post.id },
        data: { scheduledAt: input.scheduledAt },
      }),
    ),
  ]);

  const delayMs = input.scheduledAt.getTime() - Date.now();
  for (const post of campaign.socialPosts) {
    // eslint-disable-next-line no-await-in-loop
    await enqueuePublishJob(post.id, delayMs);
  }

  logger.info(
    { campaignId: campaign.id, scheduledAt: input.scheduledAt, postCount: campaign.socialPosts.length },
    'Campaign scheduled',
  );

  return campaignRepo.findByIdWithPosts(campaign.id);
}
