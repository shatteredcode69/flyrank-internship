import type { Platform } from '@prisma/client';
import { prisma } from '../prisma-client.js';

export class WebhookEventRepository {
  /** Replay-protection: platformEventId is unique, so a re-delivered event is a no-op on retry. */
  async recordIfNew(params: {
    platformEventId: string;
    platform: Platform;
    signatureValid: boolean;
    payload: object;
    socialPostId?: string;
  }): Promise<{ isNew: boolean }> {
    const existing = await prisma.webhookEvent.findUnique({
      where: { platformEventId: params.platformEventId },
    });
    if (existing) return { isNew: false };

    await prisma.webhookEvent.create({
      data: {
        platformEventId: params.platformEventId,
        platform: params.platform,
        signatureValid: params.signatureValid,
        payload: params.payload as never,
        socialPostId: params.socialPostId,
      },
    });
    return { isNew: true };
  }

  async markProcessed(platformEventId: string): Promise<void> {
    await prisma.webhookEvent.update({
      where: { platformEventId },
      data: { processedAt: new Date() },
    });
  }
}
