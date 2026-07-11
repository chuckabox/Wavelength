import { Router } from 'express';
import { loadEnv } from '../../config/env.js';

export const healthRouter: Router = Router();

/** Liveness: the process is up and serving. */
healthRouter.get('/health', (_req, res) => {
  res.json({ ok: true });
});

/** Readiness: dependencies are configured. DB is optional until Phase 1. */
healthRouter.get('/ready', (_req, res) => {
  const env = loadEnv();
  const checks = {
    inferenceKey: Boolean(env.DIGITAL_OCEAN_MODEL_ACCESS_KEY),
    database: Boolean(env.DATABASE_URL),
  };
  const ready = checks.inferenceKey;
  res.status(ready ? 200 : 503).json({ ready, checks });
});
