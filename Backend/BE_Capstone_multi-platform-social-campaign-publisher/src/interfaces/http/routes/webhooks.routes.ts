import { Router } from 'express';
import { socialDeliveryWebhookHandler } from '../controllers/webhooks.controller.js';
import { captureRawBody } from '../middleware/raw-body.js';

export const webhooksRouter = Router();
// captureRawBody is scoped to this router only — every other route uses the
// normal express.json() parser mounted in app.ts.
webhooksRouter.post('/webhook/social-delivery', captureRawBody, socialDeliveryWebhookHandler);
