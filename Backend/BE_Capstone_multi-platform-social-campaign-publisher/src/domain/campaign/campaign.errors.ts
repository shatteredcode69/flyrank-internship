import { AppError } from '../../shared/errors/app-error.js';

export const CampaignErrors = {
  notFound: (id: string) => AppError.notFound(`Campaign ${id} not found`, { campaignId: id }),
  alreadyScheduled: (id: string) =>
    AppError.conflict(`Campaign ${id} is already scheduled or in progress`, { campaignId: id }),
  scheduledAtInPast: () =>
    AppError.validation('scheduledAt must be in the future'),
};
