import { z } from 'zod';

export const createCampaignSchema = z.object({
  title: z.string().min(1).max(300),
  body: z.string().min(1).max(20000),
  sourceUrl: z.string().url(),
  sourceImagePath: z.string().min(1),
});
export type CreateCampaignBody = z.infer<typeof createCampaignSchema>;

export const scheduleCampaignSchema = z.object({
  scheduledAt: z.string().datetime(),
});
export type ScheduleCampaignBody = z.infer<typeof scheduleCampaignSchema>;

export const listCampaignsQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(100).default(20),
  cursor: z.string().optional(),
});
