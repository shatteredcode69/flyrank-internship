import type { Campaign as PrismaCampaign } from '@prisma/client';
import { prisma } from '../prisma-client.js';

export interface CreateCampaignData {
  title: string;
  body: string;
  sourceUrl: string;
  sourceImage: string;
}

export class CampaignRepository {
  async create(data: CreateCampaignData): Promise<PrismaCampaign> {
    return prisma.campaign.create({ data });
  }

  async findById(id: string): Promise<PrismaCampaign | null> {
    return prisma.campaign.findUnique({ where: { id } });
  }

  async findByIdWithPosts(id: string) {
    return prisma.campaign.findUnique({
      where: { id },
      include: { socialPosts: true },
    });
  }

  async list(params: { limit: number; cursor?: string }) {
    const items = await prisma.campaign.findMany({
      take: params.limit + 1,
      ...(params.cursor ? { cursor: { id: params.cursor }, skip: 1 } : {}),
      orderBy: { createdAt: 'desc' },
    });
    const hasMore = items.length > params.limit;
    const page = hasMore ? items.slice(0, params.limit) : items;
    return { items: page, nextCursor: hasMore ? page[page.length - 1]!.id : null };
  }

  async updateStatus(id: string, status: PrismaCampaign['status'], scheduledAt?: Date) {
    return prisma.campaign.update({
      where: { id },
      data: { status, ...(scheduledAt ? { scheduledAt } : {}) },
    });
  }
}
