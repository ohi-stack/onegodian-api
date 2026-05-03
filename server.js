import dotenv from 'dotenv';
import { app, logger } from './src/app.js';

dotenv.config();

const host = process.env.HOST || '0.0.0.0';
const port = Number(process.env.PORT || 3000);

const server = app.listen(port, host, () => {
  logger.info({ host, port }, 'OneGodian API Gateway started');
});

const shutdown = (signal) => {
  logger.info({ signal }, 'Shutdown signal received');
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
