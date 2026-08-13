import { Router } from 'express';
import { healthRouter } from './health.routes.js';
import { campaignsRouter } from './campaigns.routes.js';
import { socialPostsRouter } from './social-posts.routes.js';
import { webhooksRouter } from './webhooks.routes.js';

export const rootRouter = Router();
rootRouter.use(healthRouter);
rootRouter.use(campaignsRouter);
rootRouter.use(socialPostsRouter);
rootRouter.use(webhooksRouter);
