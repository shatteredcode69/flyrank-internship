import type { SocialPost as PrismaSocialPost, SocialPostStatus, Platform } from '@prisma/client';
import { prisma } from '../prisma-client.js';

export interface CreateSocialPostData {
  campaignId: string;
  platform: Platform;
  socialAccountId: string;
  imagePath: string;
  imageWidth: number;
  imageHeight: number;
  caption: string;
  idempotencyKey: string;
  scheduledAt?: Date | null;
}

export class SocialPostRepository {
  /**
   * Relies on the DB-level unique(campaignId, platform) constraint as the
   * ultimate guard against duplicate rows — createMany with skipDuplicates
   * plus this constraint means even a concurrent double-call from two
   * request handlers can't create two SocialPost rows for the same
   * (campaign, platform) pair.
   */
  async createIfNotExists(data: CreateSocialPostData): Promise<PrismaSocialPost> {
    const existing = await prisma.socialPost.findUnique({
      where: { campaignId_platform: { campaignId: data.campaignId, platform: data.platform } },
    });
    if (existing) return existing;

    try {
      return await prisma.socialPost.create({ data });
    } catch (err) {
      // Unique constraint race: another request created it between our
      // check and our insert. Re-read and return the winner rather than
      // erroring — this IS the idempotent behavior we want.
      const raced = await prisma.socialPost.findUnique({
        where: { campaignId_platform: { campaignId: data.campaignId, platform: data.platform } },
      });
      if (raced) return raced;
      throw err;
    }
  }

  async findById(id: string): Promise<PrismaSocialPost | null> {
    return prisma.socialPost.findUnique({ where: { id } });
  }

  async findByIdempotencyKey(key: string): Promise<PrismaSocialPost | null> {
    return prisma.socialPost.findUnique({ where: { idempotencyKey: key } });
  }

  async findDueForPublish(now: Date): Promise<PrismaSocialPost[]> {
    return prisma.socialPost.findMany({
      where: { status: 'QUEUED', scheduledAt: { lte: now } },
    });
  }

  async transitionStatus(
    id: string,
    status: SocialPostStatus,
    extra: Partial<Pick<PrismaSocialPost, 'externalPostId' | 'lastError' | 'publishedAt'>> = {},
  ): Promise<PrismaSocialPost> {
    return prisma.socialPost.update({
      where: { id },
      data: { status, ...extra, attempts: { increment: status === 'PUBLISHING' ? 1 : 0 } },
    });
  }
}
