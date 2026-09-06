/**
 * Standalone entrypoint for the email worker — `npm run worker:email`.
 *
 * Runs as its own process, separate from the API server, which is the whole
 * point of the queue: a slow or refusing SMTP relay must not be able to slow
 * down or fail a request. The server enqueues and returns; this process is
 * where the latency and the retries live.
 *
 * Startup connects everything the worker needs before it takes a job —
 * Postgres (it reads invitation rows back) and SMTP — and exits if either
 * fails, mirroring index.js. That check is the reason the SMTP credentials
 * are not in REQUIRED_ENV_VARS: the API genuinely does not need them, and
 * this process genuinely cannot work without them. A worker that starts
 * without a transport looks healthy while turning every queued mail into a
 * failed job.
 *
 * See src/workers/email.worker.js and src/shared/utils/mailer.js
 */

import { connectDatabase, disconnectDatabase } from '../config/db.js';
import config from '../config/env.js';
import emailWorker from './email.worker.js';
import { verifyMailer, closeMailer } from '../shared/utils/mailer.js';
import { createLogger, flushLogger } from '../config/logger.js';

const log = createLogger('email-worker');

const startWorker = async () => {
  try {
    await connectDatabase();

    // Every message this worker sends contains a link back to the frontend,
    // so `*` — fine for CORS, and the default when CLIENT_ORIGIN is unset —
    // produces mail with an unclickable `*/invite/...` href. Catching it here
    // costs one line at boot; catching it in production costs a batch of
    // invitations that all look delivered.
    if (!config.clientOrigin || config.clientOrigin === '*') {
      throw new Error(
        'CLIENT_ORIGIN must be a real origin (e.g. http://localhost:3000) for the email worker — links are built from it.'
      );
    }

    // Proves the credentials by opening and authenticating one SMTP session,
    // rather than discovering they are wrong on the first real invitation.
    await verifyMailer();

    // Only now does the worker begin consuming. It was constructed with
    // `autorun: false` precisely so that everything above is a gate rather
    // than a race — see the comment on the Worker in email.worker.js.
    emailWorker.run();

    log.info('Worker started, listening for jobs...');
  } catch (error) {
    log.fatal({ err: error }, 'Failed to start worker');
    await flushLogger();
    process.exit(1);
  }
};

startWorker();

// Close the worker before exiting so an in-flight job is finished rather
// than left stalled until BullMQ's lock expires. The mailer's pooled
// connection is closed after it, not before — closing first would kill the
// socket out from under a send that is still finishing.
const shutdown = async (signal) => {
  log.info(`${signal} received, closing worker...`);
  await emailWorker.close();
  closeMailer();
  await disconnectDatabase();
  await flushLogger();
  process.exit(0);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
