import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../../../shared/errors/app-error.js';
import { logger } from '../../../shared/logging/logger.js';

/**
 * Centralized error → HTTP response translation (§18). Internal stack
 * traces never reach the client in production; every response includes the
 * correlation ID so a log line can be found from a support report.
 */
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction): void {
  const correlationId = req.correlationId;

  if (err instanceof AppError) {
    logger.warn({ err, correlationId, type: err.type }, 'Handled application error');
    res.status(err.status).json({
      error: { type: err.type, message: err.message, details: err.details, correlationId },
    });
    return;
  }

  logger.error({ err, correlationId }, 'Unhandled error');
  const isProd = process.env.NODE_ENV === 'production';
  res.status(500).json({
    error: {
      type: 'InternalError',
      message: isProd ? 'An unexpected error occurred' : String(err instanceof Error ? err.message : err),
      correlationId,
    },
  });
}

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    error: { type: 'NotFoundError', message: `No route for ${req.method} ${req.path}`, correlationId: req.correlationId },
  });
}
