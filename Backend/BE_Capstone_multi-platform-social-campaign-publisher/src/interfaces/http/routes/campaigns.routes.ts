import { Router } from 'express';
import {
  createCampaignHandler,
  getCampaignHandler,
  listCampaignsHandler,
  scheduleCampaignHandler,
} from '../controllers/campaigns.controller.js';

export const campaignsRouter = Router();
campaignsRouter.post('/api/campaigns', createCampaignHandler);
campaignsRouter.get('/api/campaigns', listCampaignsHandler);
campaignsRouter.get('/api/campaigns/:id', getCampaignHandler);
campaignsRouter.post('/api/campaigns/:id/schedule', scheduleCampaignHandler);
