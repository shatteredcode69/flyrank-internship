import type { Request, Response, NextFunction } from 'express';
import { createCampaignSchema, scheduleCampaignSchema, listCampaignsQuerySchema } from '../schemas/campaign.schemas.js';
import { createCampaign } from '../../../application/campaigns/create-campaign.usecase.js';
import { getCampaign } from '../../../application/campaigns/get-campaign.usecase.js';
import { listCampaigns } from '../../../application/campaigns/list-campaigns.usecase.js';
import { scheduleCampaign } from '../../../application/scheduling/schedule-post-job.js';
import { AppError } from '../../../shared/errors/app-error.js';

export async function createCampaignHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const body = createCampaignSchema.parse(req.body);
    const result = await createCampaign(body);
    res.status(201).json(result);
  } catch (err) {
    next(toValidationErrorIfZod(err));
  }
}

export async function getCampaignHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const campaign = await getCampaign(req.params.id as string);
    res.status(200).json(campaign);
  } catch (err) {
    next(err);
  }
}

export async function listCampaignsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const query = listCampaignsQuerySchema.parse(req.query);
    const result = await listCampaigns(query);
    res.status(200).json(result);
  } catch (err) {
    next(toValidationErrorIfZod(err));
  }
}

export async function scheduleCampaignHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const body = scheduleCampaignSchema.parse(req.body);
    const result = await scheduleCampaign({
      campaignId: req.params.id as string,
      scheduledAt: new Date(body.scheduledAt),
    });
    res.status(200).json(result);
  } catch (err) {
    next(toValidationErrorIfZod(err));
  }
}

function toValidationErrorIfZod(err: unknown): unknown {
  if (err && typeof err === 'object' && 'issues' in err) {
    return AppError.validation('Request validation failed', { issues: (err as { issues: unknown }).issues });
  }
  return err;
}
