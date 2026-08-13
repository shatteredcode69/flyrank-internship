import IORedis, { type Redis } from 'ioredis';
import { env } from '../../config/env.js';

/**
 * BullMQ requires maxRetriesPerRequest: null on the connection it manages.
 * One shared connection is reused by both the queue producer and the
 * worker's underlying connection factory.
 */
export function createRedisConnection(): Redis {
  return new IORedis(env.REDIS_URL, { maxRetriesPerRequest: null });
}
