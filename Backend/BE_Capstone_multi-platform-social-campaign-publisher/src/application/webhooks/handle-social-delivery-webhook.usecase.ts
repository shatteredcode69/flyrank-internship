import { z } from 'zod';
import { verifySignature } from '../../infrastructure/crypto/webhook-signature.js';
import { WebhookEventRepository } from '../../infrastructure/database/repositories/webhook-event.repository.js';
import { SocialPostRepository } from '../../infrastructure/database/repositories/social-post.repository.js';
import { CampaignRepository } from '../../infrastructure/database/repositories/campaign.repository.js';
import { prisma } from '../../infrastructure/database/prisma-client.js';
import { isValidTransition } from '../../domain/social-post/social-post-status.js';
import { AppError } from '../../shared/errors/app-error.js';
import { logger } from '../../shared/logging/logger.js';
import { env } from '../../config/env.js';

const webhookEventRepo = new WebhookEventRepository();
const socialPostRepo = new SocialPostRepository();
const campaignRepo = new CampaignRepository();

const deliveryPayloadSchema = z.object({
  eventId: z.string().min(1),
  externalPostId: z.string().min(1),
  platform: z.enum(['INSTAGRAM', 'X']),
  outcome: z.enum(['delivered', 'failed']),
  reason: z.string().optional(),
});

export interface HandleWebhookInput {
  rawBody: Buffer;
  signatureHeader: string | undefined;
}

export type HandleWebhookResult =
  | { outcome: 'rejected'; reason: string }
  | { outcome: 'accepted'; socialPostId: string; newStatus: 'PUBLISHED' | 'FAILED' }
  | { outcome: 'duplicate'; socialPostId: string };

/**
 * §16 of the build spec. Order of operations is deliberate and
 * security-critical:
 *   1. Verify signature over the RAW body FIRST, before parsing/trusting
 *      anything in the payload.
 *   2. On failure: 400, and — critically — do NOT touch any SocialPost
 *      status. A forged webhook must have zero side effects on data.
 *   3. On success: parse, replay-dedupe by eventId, then apply a
 *      whitelisted state transition (QUEUED/FAILED/PUBLISHED can never be
 *      reached except from PUBLISHING — see domain/social-post-status.ts).
 */
export async function handleSocialDeliveryWebhook(input: HandleWebhookInput): Promise<HandleWebhookResult> {
  if (!input.signatureHeader) {
    logger.warn('Webhook rejected: missing signature header');
    return { outcome: 'rejected', reason: 'missing signature' };
  }

  const isValid = verifySignature(input.rawBody, input.signatureHeader, env.WEBHOOK_SECRET);
  if (!isValid) {
    logger.warn('Webhook rejected: signature verification failed');
    return { outcome: 'rejected', reason: 'invalid signature' };
  }

  const parsed = deliveryPayloadSchema.safeParse(JSON.parse(input.rawBody.toString('utf8')));
  if (!parsed.success) {
    // Signature was valid but payload is malformed — still a client error,
    // still zero side effects on SocialPost state.
    logger.warn({ issues: parsed.error.issues }, 'Webhook rejected: payload failed schema validation');
    return { outcome: 'rejected', reason: 'invalid payload' };
  }

  const event = parsed.data;

  const { isNew } = await webhookEventRepo.recordIfNew({
    platformEventId: event.eventId,
    platform: event.platform,
    signatureValid: true,
    payload: event,
  });

  const post = await prisma.socialPost.findFirst({ where: { externalPostId: event.externalPostId } });
  if (!post) {
    throw AppError.notFound(`No SocialPost found for externalPostId ${event.externalPostId}`);
  }

  if (!isNew) {
    logger.info({ eventId: event.eventId, socialPostId: post.id }, 'Webhook replay ignored (already processed)');
    return { outcome: 'duplicate', socialPostId: post.id };
  }

  const targetStatus = event.outcome === 'delivered' ? 'PUBLISHED' : 'FAILED';

  if (!isValidTransition(post.status, targetStatus)) {
    logger.warn(
      { socialPostId: post.id, from: post.status, to: targetStatus },
      'Webhook ignored: would violate SocialPost state machine',
    );
    await webhookEventRepo.markProcessed(event.eventId);
    return { outcome: 'duplicate', socialPostId: post.id };
  }

  await socialPostRepo.transitionStatus(post.id, targetStatus, {
    publishedAt: targetStatus === 'PUBLISHED' ? new Date() : undefined,
    lastError: targetStatus === 'FAILED' ? event.reason ?? 'platform reported delivery failure' : undefined,
  });
  await webhookEventRepo.markProcessed(event.eventId);
  await maybeCompleteCampaign(post.campaignId);

  logger.info({ socialPostId: post.id, targetStatus }, 'Webhook processed: SocialPost status updated');
  return { outcome: 'accepted', socialPostId: post.id, newStatus: targetStatus };
}

async function maybeCompleteCampaign(campaignId: string): Promise<void> {
  const posts = await prisma.socialPost.findMany({ where: { campaignId } });
  if (posts.every((p) => p.status === 'PUBLISHED')) {
    await campaignRepo.updateStatus(campaignId, 'COMPLETED');
  } else if (posts.some((p) => p.status === 'FAILED') && posts.every((p) => p.status === 'PUBLISHED' || p.status === 'FAILED')) {
    await campaignRepo.updateStatus(campaignId, 'FAILED');
  }
}
