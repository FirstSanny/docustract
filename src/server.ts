import 'dotenv/config';
import { buildApp } from './app.js';
import { env } from './config/index.js';
import { closeDb } from './db/index.js';

const app = await buildApp();

async function start() {
  try {
    await app.listen({ port: env.PORT, host: '0.0.0.0' });
    app.log.info(`DocuStract API running at http://localhost:${env.PORT}`);
    app.log.info(`API docs at http://localhost:${env.PORT}/api-docs`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

async function shutdown(signal: string) {
  app.log.info(`Received ${signal}, shutting down gracefully...`);
  await app.close();
  await closeDb();
  process.exit(0);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

start();
