import path from 'node:path';
import { CampaignRepository } from '../../infrastructure/database/repositories/campaign.repository.js';
import { SocialPostRepository } from '../../infrastructure/database/repositories/social-post.repository.js';
import { SocialAccountRepository } from '../../infrastructure/database/repositories/social-account.repository.js';
import { generateAllVariants } from '../../infrastructure/image/image-variant-generator.js';
import { composeCaption } from './compose-caption.js';
import { deterministicIdempotencyKey } from '../../shared/utilities/ids.js';
import { ALL_PLATFORMS } from '../../domain/platform/platform.js';
import { logger } from '../../shared/logging/logger.js';

const campaignRepo = new CampaignRepository();
const socialPostRepo = new SocialPostRepository();
const socialAccountRepo = new SocialAccountRepository();

export interface CreateCampaignInput {
  title: string;
  body: string;
  sourceUrl: string;
  sourceImagePath: string; // local path to the uploaded/placeholder source image
}

/**
 * Content pipeline (§8/Phase 2): validate → generate image variants →
 * compose captions → persist Campaign + one SocialPost per platform.
 * This is intentionally the ONLY place image generation + caption
 * composition + SocialPost creation are wired together.
 */
export async function createCampaign(input: CreateCampaignInput) {
  const campaign = await campaignRepo.create({
    title: input.title,
    body: input.body,
    sourceUrl: input.sourceUrl,
    sourceImage: input.sourceImagePath,
  });

  const outputDir = path.join(process.cwd(), 'storage', 'generated');
  const variants = await generateAllVariants({
    sourcePath: input.sourceImagePath,
    outputDir,
    campaignId: campaign.id,
    platforms: ALL_PLATFORMS,
  });

  const socialPosts = [];
  for (const platform of ALL_PLATFORMS) {
    const variant = variants.find((v) => v.platform === platform);
    if (!variant) throw new Error(`Missing generated variant for ${platform}`);

    // eslint-disable-next-line no-await-in-loop -- sequential for deterministic ordering/testing
    const account = await socialAccountRepo.findFirstForPlatform(platform);
    if (!account) {
      throw new Error(
        `No SocialAccount found for platform ${platform}. Run "npm run db:seed" to create fake accounts first.`,
      );
    }

    const caption = composeCaption({
      platform,
      content: { title: input.title, body: input.body, sourceUrl: input.sourceUrl },
    });

    // eslint-disable-next-line no-await-in-loop
    const post = await socialPostRepo.createIfNotExists({
      campaignId: campaign.id,
      platform,
      socialAccountId: account.id,
      imagePath: variant.path,
      imageWidth: variant.width,
      imageHeight: variant.height,
      caption,
      idempotencyKey: deterministicIdempotencyKey(campaign.id, platform),
    });
    socialPosts.push(post);
  }

  logger.info({ campaignId: campaign.id, postCount: socialPosts.length }, 'Campaign created');
  return { campaign, socialPosts };
}
