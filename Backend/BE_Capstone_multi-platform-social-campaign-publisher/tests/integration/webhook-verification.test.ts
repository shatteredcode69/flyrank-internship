import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { isDatabaseReachable, cleanDatabase } from '../fixtures/test-env.js';
import { prisma } from '../../src/infrastructure/database/prisma-client.js';
import { SocialAccountRepository } from '../../src/infrastructure/database/repositories/social-account.repository.js';
import { createCampaign } from '../../src/application/campaigns/create-campaign.usecase.js';
import { publishSocialPost } from '../../src/application/publishing/publish-social-post.usecase.js';
import { handleSocialDeliveryWebhook } from '../../src/application/webhooks/handle-social-delivery-webhook.usecase.js';
import { computeSignature } from '../../src/infrastructure/crypto/webhook-signature.js';
import { env } from '../../src/config/env.js';

/** Covers Acceptance Probe 4: forged webhook -> 400 & unchanged status; valid webhook -> published. */
describe.runIf(await isDatabaseReachable())('webhook verification (integration)', () => {
  const socialAccountRepo = new SocialAccountRepository();

  beforeAll(async () => {
    await cleanDatabase();
    for (const [platform, externalAccountId] of [
      ['INSTAGRAM', 'ig_test'],
      ['X', 'x_test'],
    ] as const) {
      await socialAccountRepo.upsertWithToken({ platform, externalAccountId, plaintextToken: 'fake-token' });
    }
  });

  beforeEach(async () => {
    await prisma.webhookEvent.deleteMany();
    await prisma.socialPost.deleteMany();
    await prisma.idempotencyRecord.deleteMany();
    await prisma.campaign.deleteMany();
  });

  async function publishedPost() {
    const { socialPosts } = await createCampaign({
      title: 'Webhook Probe',
      body: 'Body text.',
      sourceUrl: 'https://blog.example.com/webhook-probe',
      sourceImagePath: 'tests/fixtures/placeholder-source.jpg',
    });
    const target = socialPosts[0]!;
    await publishSocialPost(target.id);
    return prisma.socialPost.findUniqueOrThrow({ where: { id: target.id } });
  }

  it('rejects a forged signature with no status change', async () => {
    const post = await publishedPost();
    const payload = JSON.stringify({
      eventId: 'evt_forged_1',
      externalPostId: post.externalPostId,
      platform: post.platform,
      outcome: 'delivered',
    });

    const result = await handleSocialDeliveryWebhook({
      rawBody: Buffer.from(payload),
      signatureHeader: 'deadbeefdeadbeefdeadbeefdeadbeef',
    });

    expect(result.outcome).toBe('rejected');
    const unchanged = await prisma.socialPost.findUniqueOrThrow({ where: { id: post.id } });
    expect(unchanged.status).toBe('PUBLISHING'); // unchanged, still awaiting a valid webhook
  });

  it('accepts a validly signed webhook and flips status to PUBLISHED', async () => {
    const post = await publishedPost();
    const payload = JSON.stringify({
      eventId: 'evt_valid_1',
      externalPostId: post.externalPostId,
      platform: post.platform,
      outcome: 'delivered',
    });
    const signature = computeSignature(payload, env.WEBHOOK_SECRET);

    const result = await handleSocialDeliveryWebhook({
      rawBody: Buffer.from(payload),
      signatureHeader: signature,
    });

    expect(result).toMatchObject({ outcome: 'accepted', newStatus: 'PUBLISHED' });
    const updated = await prisma.socialPost.findUniqueOrThrow({ where: { id: post.id } });
    expect(updated.status).toBe('PUBLISHED');
    expect(updated.publishedAt).toBeTruthy();
  });

  it('ignores a replayed duplicate eventId without reprocessing', async () => {
    const post = await publishedPost();
    const payload = JSON.stringify({
      eventId: 'evt_replay_1',
      externalPostId: post.externalPostId,
      platform: post.platform,
      outcome: 'delivered',
    });
    const signature = computeSignature(payload, env.WEBHOOK_SECRET);

    await handleSocialDeliveryWebhook({ rawBody: Buffer.from(payload), signatureHeader: signature });
    const second = await handleSocialDeliveryWebhook({ rawBody: Buffer.from(payload), signatureHeader: signature });

    expect(second.outcome).toBe('duplicate');
  });
});
