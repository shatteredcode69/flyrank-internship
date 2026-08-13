import type { IdempotencyRecord, IdempotencyStatus } from '@prisma/client';
import { prisma } from '../prisma-client.js';

/**
 * The durable ledger of publish attempts. This is what makes the "timeout
 * after the platform accepted but before we heard back" case safe: on
 * retry, we consult this record BEFORE calling the platform again. If a
 * prior attempt is IN_FLIGHT, we ask the platform for status via the same
 * idempotency key rather than blindly firing a new publish call.
 */
export class IdempotencyRepository {
  async startOrGetExisting(idempotencyKey: string, socialPostId: string): Promise<IdempotencyRecord> {
    const existing = await prisma.idempotencyRecord.findUnique({ where: { idempotencyKey } });
    if (existing) return existing;

    try {
      return await prisma.idempotencyRecord.create({
        data: { idempotencyKey, socialPostId, status: 'IN_FLIGHT' },
      });
    } catch {
      const raced = await prisma.idempotencyRecord.findUnique({ where: { idempotencyKey } });
      if (raced) return raced;
      throw new Error(`Failed to start or read idempotency record for ${idempotencyKey}`);
    }
  }

  async complete(idempotencyKey: string, externalPostId: string, responseHash: string): Promise<void> {
    await prisma.idempotencyRecord.update({
      where: { idempotencyKey },
      data: { status: 'COMPLETED', externalPostId, responseHash },
    });
  }

  async fail(idempotencyKey: string): Promise<void> {
    await prisma.idempotencyRecord.update({
      where: { idempotencyKey },
      data: { status: 'FAILED' },
    });
  }

  async find(idempotencyKey: string): Promise<IdempotencyRecord | null> {
    return prisma.idempotencyRecord.findUnique({ where: { idempotencyKey } });
  }
}

export type { IdempotencyStatus };
