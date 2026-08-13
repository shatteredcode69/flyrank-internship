import { CampaignRepository } from '../../infrastructure/database/repositories/campaign.repository.js';
import { CampaignErrors } from '../../domain/campaign/campaign.errors.js';

const campaignRepo = new CampaignRepository();

export async function getCampaign(id: string) {
  const campaign = await campaignRepo.findByIdWithPosts(id);
  if (!campaign) throw CampaignErrors.notFound(id);
  return campaign;
}
