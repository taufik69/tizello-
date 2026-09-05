import { connectDatabase, disconnectDatabase } from '../config/db.js';
import emailWorker from './email.worker.js';
import { createLogger, flushLogger } from '../config/logger.js';

const log = createLogger('email-worker');

// Standalone entrypoint: connects Postgres (the worker reads invitation rows
// back), then listens on the email queue. Run as its own process, separate
// from the API server — `npm run worker:email`.
const startWorker = async () => {
  try {
    await connectDatabase();
    log.info('Worker started, listening for jobs...');
  } catch (error) {
    log.fatal({ err: error }, 'Failed to start worker');
    await flushLogger();
    process.exit(1);
  }
};

startWorker();

// Close the worker before exiting so an in-flight job is finished rather
// than left stalled until BullMQ's lock expires.
const shutdown = async (signal) => {
  log.info(`${signal} received, closing worker...`);
  await emailWorker.close();
  await disconnectDatabase();
  await flushLogger();
  process.exit(0);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
