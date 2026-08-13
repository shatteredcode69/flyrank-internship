import express, { type Express } from 'express';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { requestIdMiddleware } from './interfaces/http/middleware/request-id.js';
import { errorHandler, notFoundHandler } from './interfaces/http/middleware/error-handler.js';
import { webhooksRouter } from './interfaces/http/routes/webhooks.routes.js';
import { healthRouter } from './interfaces/http/routes/health.routes.js';
import { campaignsRouter } from './interfaces/http/routes/campaigns.routes.js';
import { socialPostsRouter } from './interfaces/http/routes/social-posts.routes.js';
import pinoHttp from 'pino-http';
import { logger } from './shared/logging/logger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function buildApp(): Express {
  const app = express();

  app.use(requestIdMiddleware);
  app.use(pinoHttp({ logger, genReqId: (req) => (req as { correlationId?: string }).correlationId }));

  // IMPORTANT: mounted BEFORE the global JSON body parser below, because
  // the webhook route needs the untouched raw bytes for HMAC verification
  // (its own captureRawBody middleware is attached per-route). If a global
  // express.json() ran first, it would consume the stream and the
  // signature check would silently break.
  app.use(webhooksRouter);

  app.use(express.json({ limit: '5mb' })); // request size limit, §17
  app.use(healthRouter);
  app.use(campaignsRouter);
  app.use(socialPostsRouter);

  try {
    const openapiPath = path.join(__dirname, '..', 'docs', 'openapi.yaml');
    const openapiDocument = YAML.load(openapiPath);
    app.use('/docs', swaggerUi.serve, swaggerUi.setup(openapiDocument));
  } catch (err) {
    logger.warn({ err }, 'OpenAPI spec not loaded — /docs will be unavailable');
  }

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
