import { loadEnv } from './config/env.js';
import { logger } from './logger.js';
import { createApp } from './app.js';

function main(): void {
  const env = loadEnv();
  const app = createApp();

  const server = app.listen(env.PORT, () => {
    logger.info({ port: env.PORT, env: env.NODE_ENV }, 'Wavelength server listening');
    if (!env.DIGITAL_OCEAN_MODEL_ACCESS_KEY) {
      logger.warn(
        'DIGITAL_OCEAN_MODEL_ACCESS_KEY is not set — inference calls will fail. Set it in server/.env',
      );
    }
  });

  const shutdown = (sig: string): void => {
    logger.info({ sig }, 'Shutting down');
    server.close(() => process.exit(0));
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

main();
