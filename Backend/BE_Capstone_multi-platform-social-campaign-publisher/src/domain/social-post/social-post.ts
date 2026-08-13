import type { Platform } from '../platform/platform.js';
import type { SocialPostStatus } from './social-post-status.js';

export interface SocialPost {
  id: string;
  campaignId: string;
  platform: Platform;
  socialAccountId: string;
  imagePath: string;
  imageWidth: number;
  imageHeight: number;
  caption: string;
  idempotencyKey: string;
  status: SocialPostStatus;
  externalPostId: string | null;
  attempts: number;
  lastError: string | null;
  scheduledAt: Date | null;
  publishedAt: Date | null;
}
