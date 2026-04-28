import 'dotenv/config';
import { createApp } from './app.js';

const port = Number(process.env.PORT || 3000);
const app = createApp();

const server = app.listen(port, () => {
  console.log(`onegodian-api listening on ${port}`);
});

function shutdown(signal) {
  console.log(`${signal} received, shutting down onegodian-api`);
  server.close(() => process.exit(0));
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
