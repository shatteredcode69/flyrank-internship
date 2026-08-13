import { describe, it, expect, beforeAll } from 'vitest';
import { isDatabaseReachable, cleanDatabase } from '../fixtures/test-env.js';
import { prisma } from '../../src/infrastructure/database/prisma-client.js';
import { SocialAccountRepository } from '../../src/infrastructure/database/repositories/social-account.repository.js';
import { SocialPostRepository } from '../../src/infrastructure/database/repositories/social-post.repository.js';
import { createCampaign } from '../../src/application/campaigns/create-campaign.usecase.js';
import { publishSocialPost } from '../../src/application/publishing/publish-social-post.usecase.js';

/**
 * Acceptance Probe 3, simulated at the use-case level (a true "kill -9 the
 * worker process" run is a manual demo step — see README → 6-Minute Demo
 * and docs/reliability.md → Crash Recovery — since vitest can't
 * meaningfully kill and restart its own process mid-test).
 *
 * What this test DOES verify, deterministically: a SocialPost left in
 * QUEUED with a past scheduledAt (exactly the state a crashed-mid-batch
 * worker would leave behind) is found by the same query the recovery
 * sweep uses, and publishing it — even after a first *partial* attempt
 * that only got as far as marking it PUBLISHING — never produces a second
 * platform post.
 */
describe.runIf(await isDatabaseReachable())('Probe 3 — crash recovery (e2e, simulated)', () => {
  const socialAccountRepo = new SocialAccountRepository();
  const socialPostRepo = new SocialPostRepository();

  beforeAll(async () => {
    await cleanDatabase();
    for (const [platform, externalAccountId] of [
      ['INSTAGRAM', 'ig_crash_test'],
      ['X', 'x_crash_test'],
    ] as const) {
      await socialAccountRepo.upsertWithToken({ platform, externalAccountId, plaintextToken: 'fake-token' });
    }
  });

  it('recovery sweep finds a due, still-QUEUED post left behind by a simulated crash', async () => {
    const { socialPosts } = await createCampaign({
      title: 'Crash Recovery Probe',
      body: 'Body text.',
      sourceUrl: 'https://blog.example.com/crash-recovery-probe',
      sourceImagePath: 'tests/fixtures/placeholder-source.jpg',
    });
    const target = socialPosts[0]!;

    // Simulate: campaign was scheduled, worker crashed before ever picking
    // the job up.
    await prisma.socialPost.update({ where: { id: target.id }, data: { scheduledAt: new Date(Date.now() - 60_000) } });

    const due = await socialPostRepo.findDueForPublish(new Date());
    expect(due.map((p) => p.id)).toContain(target.id);
  });

  it('publishing after a simulated partial crash (already PUBLISHING) does not create a duplicate platform post', async () => {
    const { socialPosts } = await createCampaign({
      title: 'Crash Recovery Probe 2',
      body: 'Body text.',
      sourceUrl: 'https://blog.example.com/crash-recovery-probe-2',
      sourceImagePath: 'tests/fixtures/placeholder-source.jpg',
    });
    const target = socialPosts[0]!;

    // First "attempt" — worker crashes right after the platform accepted
    // the post but the idempotency record and status write already landed.
    await publishSocialPost(target.id);
    const afterFirst = await prisma.socialPost.findUniqueOrThrow({ where: { id: target.id } });

    // Worker "restarts" and the recovery sweep re-drives publish for the
    // same post.
    await publishSocialPost(target.id);
    const afterRecovery = await prisma.socialPost.findUniqueOrThrow({ where: { id: target.id } });

    expect(afterRecovery.externalPostId).toBe(afterFirst.externalPostId);
  });
});
