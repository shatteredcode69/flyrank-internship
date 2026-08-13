import { describe, it, expect, beforeAll } from 'vitest';
import { isDatabaseReachable, cleanDatabase } from '../fixtures/test-env.js';
import { SocialAccountRepository } from '../../src/infrastructure/database/repositories/social-account.repository.js';
import { createCampaign } from '../../src/application/campaigns/create-campaign.usecase.js';
import { publishSocialPost } from '../../src/application/publishing/publish-social-post.usecase.js';
import { prisma } from '../../src/infrastructure/database/prisma-client.js';

/**
 * Acceptance Probe 2. The fake platform (fake-platform/src/routes.ts) rate
 * limits after 3 requests per 10s window per account and returns
 * Retry-After: 2. This test fires enough concurrent publishes against
 * distinct campaigns sharing one account to reliably trigger a 429, then
 * asserts publish still converges on success without hammering (our
 * client backs off — see infrastructure/platforms/fake-platform-http-client.ts).
 */
describe.runIf(await isDatabaseReachable())('Probe 2 — rate limit handling (e2e)', () => {
  const socialAccountRepo = new SocialAccountRepository();

  beforeAll(async () => {
    await cleanDatabase();
    for (const [platform, externalAccountId] of [
      ['INSTAGRAM', 'ig_ratelimit_test'],
      ['X', 'x_ratelimit_test'],
    ] as const) {
      await socialAccountRepo.upsertWithToken({ platform, externalAccountId, plaintextToken: 'fake-token' });
    }
  });

  it('publishes successfully even when the platform returns 429 mid-flight', async () => {
    const campaigns = await Promise.all(
      Array.from({ length: 6 }, (_, i) =>
        createCampaign({
          title: `Rate Limit Probe ${i}`,
          body: 'Body text.',
          sourceUrl: `https://blog.example.com/rate-limit-probe-${i}`,
          sourceImagePath: 'tests/fixtures/placeholder-source.jpg',
        }),
      ),
    );

    const igPosts = campaigns.map((c) => c.socialPosts.find((p) => p.platform === 'INSTAGRAM')!);
    await Promise.all(igPosts.map((p) => publishSocialPost(p.id)));

    const finalPosts = await prisma.socialPost.findMany({ where: { id: { in: igPosts.map((p) => p.id) } } });
    for (const post of finalPosts) {
      expect(post.status).toBe('PUBLISHING'); // publish call succeeded; PUBLISHED awaits the webhook
      expect(post.externalPostId).toBeTruthy();
    }
  }, 30000);
});
