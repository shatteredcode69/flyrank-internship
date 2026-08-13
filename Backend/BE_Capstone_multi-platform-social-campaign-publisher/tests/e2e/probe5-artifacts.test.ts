import { describe, it, expect, beforeAll } from 'vitest';
import sharp from 'sharp';
import { isDatabaseReachable, cleanDatabase } from '../fixtures/test-env.js';
import { SocialAccountRepository } from '../../src/infrastructure/database/repositories/social-account.repository.js';
import { createCampaign } from '../../src/application/campaigns/create-campaign.usecase.js';

/** Acceptance Probe 5: inspect generated artifacts + caption distinctness. */
describe.runIf(await isDatabaseReachable())('Probe 5 — generated artifacts (e2e)', () => {
  const socialAccountRepo = new SocialAccountRepository();

  beforeAll(async () => {
    await cleanDatabase();
    for (const [platform, externalAccountId] of [
      ['INSTAGRAM', 'ig_artifacts_test'],
      ['X', 'x_artifacts_test'],
    ] as const) {
      await socialAccountRepo.upsertWithToken({ platform, externalAccountId, plaintextToken: 'fake-token' });
    }
  });

  it('generates a 1080x1080 Instagram file and a 1600x900 X file with distinct captions', async () => {
    const { socialPosts } = await createCampaign({
      title: 'Artifact Probe',
      body: 'Body text for the artifact probe.',
      sourceUrl: 'https://blog.example.com/artifact-probe',
      sourceImagePath: 'tests/fixtures/placeholder-source.jpg',
    });

    const ig = socialPosts.find((p) => p.platform === 'INSTAGRAM')!;
    const x = socialPosts.find((p) => p.platform === 'X')!;

    const igMeta = await sharp(ig.imagePath).metadata();
    const xMeta = await sharp(x.imagePath).metadata();

    expect(igMeta.width).toBe(1080);
    expect(igMeta.height).toBe(1080);
    expect(xMeta.width).toBe(1600);
    expect(xMeta.height).toBe(900);
    expect(ig.caption).not.toBe(x.caption);
  });
});
