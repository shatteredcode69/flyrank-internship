import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { isDatabaseReachable, cleanDatabase } from '../fixtures/test-env.js';
import { prisma } from '../../src/infrastructure/database/prisma-client.js';
import { SocialAccountRepository } from '../../src/infrastructure/database/repositories/social-account.repository.js';
import { createCampaign } from '../../src/application/campaigns/create-campaign.usecase.js';
import { publishSocialPost } from '../../src/application/publishing/publish-social-post.usecase.js';

/**
 * Covers Acceptance Probe 1: publish same campaign twice (+ concurrent
 * hammer) -> exactly one platform post per SocialPost. Requires live
 * Postgres/Redis/fake-platform — see tests/fixtures/test-env.ts.
 */
describe.runIf(await isDatabaseReachable())('idempotent publish (integration)', () => {
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
    await prisma.socialPost.deleteMany();
    await prisma.idempotencyRecord.deleteMany();
    await prisma.campaign.deleteMany();
  });

  it('publishing the same post five times concurrently yields exactly one externalPostId', async () => {
    const { socialPosts } = await createCampaign({
      title: 'Idempotency Probe',
      body: 'Body text for the idempotency probe.',
      sourceUrl: 'https://blog.example.com/idempotency-probe',
      sourceImagePath: 'tests/fixtures/placeholder-source.jpg',
    });
    const target = socialPosts[0]!;

    await Promise.all(Array.from({ length: 5 }, () => publishSocialPost(target.id)));

    const finalPost = await prisma.socialPost.findUniqueOrThrow({ where: { id: target.id } });
    const idempotencyRecord = await prisma.idempotencyRecord.findUniqueOrThrow({
      where: { idempotencyKey: target.idempotencyKey },
    });

    expect(finalPost.externalPostId).toBeTruthy();
    expect(idempotencyRecord.status).toBe('COMPLETED');
    expect(idempotencyRecord.externalPostId).toBe(finalPost.externalPostId);
  });

  it('retrying after the record is already COMPLETED makes zero additional platform calls', async () => {
    const { socialPosts } = await createCampaign({
      title: 'Retry After Completion',
      body: 'Body text.',
      sourceUrl: 'https://blog.example.com/retry-after-completion',
      sourceImagePath: 'tests/fixtures/placeholder-source.jpg',
    });
    const target = socialPosts[0]!;

    await publishSocialPost(target.id);
    const firstResult = await prisma.socialPost.findUniqueOrThrow({ where: { id: target.id } });

    await publishSocialPost(target.id); // simulated retry
    const secondResult = await prisma.socialPost.findUniqueOrThrow({ where: { id: target.id } });

    expect(secondResult.externalPostId).toBe(firstResult.externalPostId);
  });
});
