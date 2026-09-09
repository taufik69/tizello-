/**
 * The entrypoint for every background worker — `npm run worker`.
 *
 * Runs as its own process, separate from the API server, which is the whole
 * point of the queue: a slow or refusing SMTP relay must not be able to slow
 * down or fail a request. The server enqueues and returns; this process is where
 * the latency and the retries live.
 *
 * **One process, all workers** — not one process per worker. Every worker here
 * shares the same Postgres pool, the same Redis connection and the same SMTP
 * transport, and a process per worker would open a fresh set of each: on Gmail
 * that alone can trip the per-account connection limit (see
 * `config.mail.maxConnections`). Parallelism comes from `concurrency` on each
 * worker, which is where it belongs — jobs are I/O-bound, so the gain is in
 * overlapping waits, not in more event loops. When one worker genuinely needs to
 * be isolated or scaled on its own, run it alone: `npm run worker -- <name>`.
 *
 * Startup connects everything the workers need and then gates each one on its own
 * `verify` from `registry.js`, exiting if any fails — mirroring index.js. That
 * gate is the reason the SMTP credentials are not in REQUIRED_ENV_VARS: the API
 * genuinely does not need them, and this process genuinely cannot work without
 * them. A worker that starts without a transport looks healthy while turning
 * every queued mail into a failed job.
 *
 * **Outside production, missing SMTP credentials are not fatal** — `verifyMailer`
 * puts the mailer in log-only mode and the worker runs, writing each message
 * (including the invite link) to this log instead of sending it. Without that
 * there is no local path through the invitation flow at all. In production the
 * behaviour is unchanged: no credentials, no boot.
 *
 * See src/workers/registry.js, src/workers/email.worker.js,
 *      src/shared/utils/mailer.js and src/queues/email.queue.js
 */

import { connectDatabase, disconnectDatabase } from '../config/db.js';
import config from '../config/env.js';
import { createLogger, flushLogger } from '../config/logger.js';
import { closeMailer } from '../shared/utils/mailer.js';
import { workers, workerNames } from './registry.js';

const log = createLogger('worker');

/**
 * Which workers this process should run.
 *
 * No argument means all of them, which is what `npm run worker` does. Names
 * after it select a subset (`npm run worker -- email`) for the case where one
 * worker has to be isolated or scaled separately. An unknown name exits rather
 * than starting nothing: a typo that silently attends no queue is the failure
 * mode this whole file is arranged to avoid.
 */
const selectWorkers = () => {
  const requested = process.argv.slice(2).filter((arg) => !arg.startsWith('-'));

  if (requested.length === 0) return workers;

  const unknown = requested.filter((name) => !workerNames.includes(name));

  if (unknown.length > 0) {
    throw new Error(
      `Unknown worker(s): ${unknown.join(', ')}. Registered: ${workerNames.join(', ')}.`
    );
  }

  return workers.filter((entry) => requested.includes(entry.name));
};

/* Set before the first `await` so a signal arriving mid-startup still shuts down
   whatever is already running, rather than killing the process with a half-open
   Postgres pool and an SMTP socket Gmail has to time out on its own. */
let running = [];

const startWorkers = async () => {
  try {
    const selected = selectWorkers();

    await connectDatabase();

    /* Sequential, not `Promise.all`. These are preconditions, and the first
       failure is the one worth reading — running them together means an SMTP
       error and a config error arrive interleaved, and the process exits on
       whichever rejected first. */
    for (const entry of selected) {
      if (entry.verify) await entry.verify();
    }

    /* Only now does anything begin consuming. Every worker was constructed with
       `autorun: false` precisely so that everything above is a gate rather than
       a race — see the comment on the Worker in email.worker.js. */
    for (const entry of selected) {
      entry.worker.run();
      running.push(entry);
    }

    log.info(
      {
        workers: running.map((entry) => entry.name),
        concurrency: config.worker.concurrency,
      },
      `${running.length} worker(s) started, listening for jobs...`
    );
  } catch (error) {
    log.fatal({ err: error }, 'Failed to start workers');
    await flushLogger();
    process.exit(1);
  }
};

startWorkers();

/**
 * Close every worker before exiting so in-flight jobs finish rather than being
 * left stalled until BullMQ's lock expires.
 *
 * The workers close in parallel — they are independent, and a shutdown that
 * waits for each in turn is as slow as their sum, which on a deploy is the
 * difference between a rolling restart and a timeout. The mailer is closed AFTER
 * them, never before: closing first would kill the socket out from under a send
 * that is still finishing.
 */
const shutdown = async (signal) => {
  log.info({ signal, workers: running.map((entry) => entry.name) }, 'Signal received, closing workers...');

  await Promise.all(running.map((entry) => entry.worker.close()));
  closeMailer();
  await disconnectDatabase();
  await flushLogger();
  process.exit(0);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
