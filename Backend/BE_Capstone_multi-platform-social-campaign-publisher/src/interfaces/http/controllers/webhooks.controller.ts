import type { Request, Response, NextFunction } from 'express';
import { handleSocialDeliveryWebhook } from '../../../application/webhooks/handle-social-delivery-webhook.usecase.js';
import { getRawBody } from '../middleware/raw-body.js';

export async function socialDeliveryWebhookHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await handleSocialDeliveryWebhook({
      rawBody: getRawBody(req),
      signatureHeader: req.header('x-webhook-signature'),
    });

    if (result.outcome === 'rejected') {
      res.status(400).json({ error: { type: 'WebhookVerificationError', message: result.reason } });
      return;
    }
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}
