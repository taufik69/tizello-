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
 * **Outside production, missing credentials are not fatal** — `verifyMailer`
 * puts the mailer in log-only mode and the worker runs, writing each message
 * (including the invite link) to this log instead of sending it. Without that,
 * there is no local path through the invitation flow at all: nothing is ever
 * attempted, so the accept screen can never be reached. In production the
 * behaviour is unchanged — no credentials, no boot.
 *
 * See src/workers/email.worker.js, src/shared/utils/mailer.js
 *      and .claude/plan/member.md §2.7
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
    //
    // A hard failure in log-only mode too, deliberately: a logged link built
    // from `*` is as useless as a sent one, and discovering that in development
    // is the entire point of the mode.
    if (!config.clientOrigin || config.clientOrigin === '*') {
      throw new Error(
        'CLIENT_ORIGIN must be a real origin (e.g. http://localhost:3000) for the email worker — links are built from it.'
      );
    }

    // Proves the credentials by opening and authenticating one SMTP session,
    // rather than discovering they are wrong on the first real invitation. In
    // log-only mode (no credentials, not production) it warns and returns
    // instead — the decision is inside `verifyMailer` so that this entrypoint
    // and any future one cannot disagree about when mail may be skipped.
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
