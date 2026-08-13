import type { Platform } from '../../domain/platform/platform.js';

export interface PublishInput {
  idempotencyKey: string;
  platform: Platform;
  accessToken: string; // decrypted, in-memory only — never persisted or logged
  externalAccountId: string;
  imagePath: string;
  caption: string;
}

export interface PublishResult {
  externalPostId: string;
  /** True if the platform recognized the idempotency key and returned the
   *  ORIGINAL result rather than creating a new post. */
  wasDeduplicated: boolean;
}

export interface StatusInput {
  platform: Platform;
  accessToken: string;
  externalPostId: string;
}

export type PublishStatusValue = 'pending' | 'delivered' | 'failed';

export interface PublishStatus {
  externalPostId: string;
  status: PublishStatusValue;
}

/**
 * The one interface the application layer depends on. It never knows which
 * concrete platform it's talking to — see docs/architecture.md → Adapter
 * Architecture. Adding a platform = implementing this interface once.
 */
export interface SocialPublisher {
  readonly platform: Platform;
  publish(input: PublishInput): Promise<PublishResult>;
  getStatus(input: StatusInput): Promise<PublishStatus>;
}
