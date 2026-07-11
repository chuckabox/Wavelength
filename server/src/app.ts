import express, { type Express } from 'express';
import { pinoHttp } from 'pino-http';
import { logger } from './logger.js';
import { AppError } from './errors.js';
import { requestId } from './http/middleware/requestId.js';
import { corsMiddleware } from './http/middleware/cors.js';
import { errorHandler } from './http/middleware/errorHandler.js';
import { healthRouter } from './http/routes/health.js';

/** Assemble the Express app. Kept pure (no listen) so tests can drive it directly. */
export function createApp(): Express {
  const app = express();
  app.disable('x-powered-by');

  app.use(requestId);
  app.use(pinoHttp({ logger, genReqId: (req) => (req as { id?: string }).id ?? '' }));
  app.use(corsMiddleware);
  app.use(express.json({ limit: '1mb' }));

  // Liveness/readiness at the root; domain routes mount under /v1 in Phase 3.
  app.use('/', healthRouter);

  // Unmatched route -> 404 through the error envelope.
  app.use((_req, _res, next) => next(AppError.notFound()));
  app.use(errorHandler);

  return app;
}
