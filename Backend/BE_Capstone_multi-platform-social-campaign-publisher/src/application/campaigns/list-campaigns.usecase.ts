import { CampaignRepository } from '../../infrastructure/database/repositories/campaign.repository.js';

const campaignRepo = new CampaignRepository();

export async function listCampaigns(params: { limit: number; cursor?: string }) {
  return campaignRepo.list(params);
}
