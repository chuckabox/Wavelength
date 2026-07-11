import cors from 'cors';
import type { RequestHandler } from 'express';
import { loadEnv } from '../../config/env.js';

const env = loadEnv();
const allowed = env.CORS_ORIGIN.split(',')
  .map((s) => s.trim())
  .filter(Boolean);

/**
 * CORS locked to the configured frontend origin(s). Requests with no Origin
 * (curl, same-origin, server-to-server) are allowed; unknown browser origins are
 * rejected. This is our only access control until auth lands in a later phase.
 */
export const corsMiddleware: RequestHandler = cors({
  origin(origin, cb) {
    if (!origin || allowed.includes(origin)) return cb(null, true);
    cb(new Error(`Origin not allowed: ${origin}`));
  },
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'x-request-id'],
});
