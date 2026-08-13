export type CampaignStatus = 'DRAFT' | 'SCHEDULED' | 'PUBLISHING' | 'COMPLETED' | 'FAILED';

export interface Campaign {
  id: string;
  title: string;
  body: string;
  sourceUrl: string;
  sourceImage: string;
  status: CampaignStatus;
  scheduledAt: Date | null;
}
