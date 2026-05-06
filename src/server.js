import 'dotenv/config';
import { createApp } from './app.js';
import { config } from './config.js';

const app = createApp();

const server = app.listen(config.PORT, () => {
  console.log(`${config.serviceName} listening on ${config.PORT}`);
});

function shutdown(signal) {
  console.log(`${signal} received, shutting down ${config.serviceName}`);
  server.close(() => process.exit(0));
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
