import { pino } from 'pino';
import { loadEnv } from './config/env.js';

const env = loadEnv();

export const logger = pino({
  level: env.LOG_LEVEL,
  // Pretty output in development; structured JSON in production.
  ...(env.NODE_ENV === 'development'
    ? { transport: { target: 'pino-pretty', options: { colorize: true, translateTime: 'HH:MM:ss' } } }
    : {}),
  // Never let a secret leak into logs.
  redact: ['req.headers.authorization', 'DIGITAL_OCEAN_MODEL_ACCESS_KEY', 'DATABASE_URL'],
});
