import type { Request, Response, NextFunction } from 'express';
import { requestCorrelationId } from '../../../shared/utilities/ids.js';

declare module 'express-serve-static-core' {
  interface Request {
    correlationId: string;
  }
}

export function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const incoming = req.header('x-correlation-id');
  req.correlationId = incoming && incoming.length > 0 ? incoming : requestCorrelationId();
  res.setHeader('x-correlation-id', req.correlationId);
  next();
}
