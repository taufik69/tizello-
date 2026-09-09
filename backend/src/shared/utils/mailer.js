/**
 * The single SMTP transport for the backend — one shared Nodemailer
 * transporter plus `sendMail` and `verifyMailer`.
 *
 * Only the email worker imports this. Nothing in a request path may: an HTTP
 * handler that sends inline inherits SMTP's latency and failure modes, so a
 * slow relay becomes a slow API and a refused connection becomes a 500 on a
 * write that already succeeded. Producers enqueue (src/queues/email.queue.js)
 * and return; the worker sends and BullMQ owns the retries.
 *
 * One module-scope transporter, never one per send. Nodemailer pools and
 * reuses the TCP+TLS connection behind a transporter, and Gmail counts new
 * connections against a per-account limit — building one per job replaces a
 * cheap reused socket with a full handshake and eventually a rate-limit
 * refusal.
 *
 * `sendMail` deliberately does NOT catch. A throw is what tells BullMQ to
 * retry the job under the queue's exponential backoff; swallowing the error
 * here would mark a mail that was never delivered as completed.
 *
 * **Two modes.** With credentials, or in production, mail is sent over SMTP and
 * a missing credential is a hard startup failure. Without credentials outside
 * production — `isMailLogOnly()` — `sendMail` writes the message to the log
 * instead of opening a transport, so the invitation and reset flows can be
 * exercised end to end on a laptop with no SMTP account: the developer reads the
 * link out of the worker's own output. That is the same bargain auth makes with
 * dev codes, and it goes through the logger rather than `console.*`, which
 * .claude/rules/logging.md forbids outright.
 *
 * Log-only mode NEVER applies in production. There, `HOST_MAIL` /
 * `HOST_APP_PASSWORD` missing means the worker refuses to start — a worker that
 * cannot send is worse than one that will not boot, because it drains the queue
 * into failed jobs while looking healthy.
 *
 * See .claude/rules/logging.md, src/queues/email.queue.js
 *      and .claude/plan/member.md §2.7
 */

import nodemailer from 'nodemailer';
import config from '../../config/env.js';
import { createLogger } from '../../config/logger.js';

const log = createLogger('mailer');

const { user, password, host, port, secure, fromName } = config.mail;

/**
 * True when both credentials are present.
 *
 * Exported so the worker entrypoint can fail fast with a clear message rather
 * than letting the first job die inside Nodemailer with an SMTP auth error
 * that reads like a network fault.
 */
const isMailConfigured = () => Boolean(user && password);

/**
 * True when mail should be logged instead of sent: no credentials, and not
 * production.
 *
 * The `nodeEnv` half is the whole safety of this feature. Keyed on the missing
 * credential alone, a production deploy that lost its SMTP secret would silently
 * "deliver" every invitation to a log file and report success — the exact failure
 * the startup check exists to prevent. Both conditions, or neither.
 */
const isMailLogOnly = () => !isMailConfigured() && config.nodeEnv !== 'production';

// Built even when unconfigured: an ESM module body runs at import time, and
// throwing here would take down the process before the entrypoint could
// print the explanation. `verifyMailer` is the gate instead.
const transporter = nodemailer.createTransport({
  host,
  port,
  secure,
  auth: { user, pass: password },
  // Reuse one connection across jobs rather than reconnecting per send.
  // `maxConnections: 1` keeps the worker to a single SMTP session — Gmail is
  // strict about concurrent connections per account, and email is not the
  // throughput bottleneck of anything here.
  pool: true,
  maxConnections: 1,
  maxMessages: 100,
});

/**
 * Opens and authenticates one SMTP connection to prove the credentials work.
 *
 * Called once at worker startup, mirroring how index.js connects Postgres and
 * Redis before serving: a worker that cannot send is worse than one that
 * refuses to start, because it drains the queue into failed jobs while
 * looking healthy.
 */
const verifyMailer = async () => {
  // Announced at `warn`, not `info`: every mail this process handles is about to
  // go to a log file instead of a person, and that has to be visible in the
  // scrollback when someone later asks why no invitation arrived.
  if (isMailLogOnly()) {
    log.warn(
      { nodeEnv: config.nodeEnv },
      'No SMTP credentials — mail is in LOG-ONLY mode. Messages, including invite and reset links, will be written to this log instead of sent.'
    );
    return;
  }

  if (!isMailConfigured()) {
    throw new Error(
      'Missing HOST_MAIL / HOST_APP_PASSWORD. The email worker cannot send without them — see .env.example.'
    );
  }

  await transporter.verify();
  log.info({ host, port, user }, 'SMTP transport ready');
};

/**
 * Sends one message and returns Nodemailer's info object.
 *
 * `to`, `subject` and `html` are required; `text` is optional but should
 * always be passed — a message with no plaintext alternative scores worse
 * with spam filters, and the templates in emailTemplates.js supply both.
 *
 * The From address is always the authenticated account. Gmail rewrites a From
 * header that is not the account it authenticated, so accepting a per-call
 * sender would produce mail whose visible sender silently disagrees with what
 * the caller asked for.
 */
const sendMail = async ({ to, subject, html, text }) => {
  // Log-only mode. The plaintext body is logged in full and ON PURPOSE: it is
  // the only way to reach the invite or reset link without an inbox, and that is
  // the entire reason this branch exists. It is gated on not-production (see
  // `isMailLogOnly`) precisely because a live token in a log file is otherwise
  // exactly what the redaction list in config/logger.js exists to prevent.
  //
  // `text`, never `html`: the templates supply both, and one is readable in a
  // terminal while the other is a wall of markup around the same link.
  if (isMailLogOnly()) {
    log.info({ to, subject, body: text ?? '(no plaintext alternative)' }, 'Mail NOT sent (log-only mode)');

    // Shaped like Nodemailer's info object so the worker's logging and any
    // future caller that reads `messageId` behave identically in both modes.
    return { messageId: 'log-only', accepted: [to], rejected: [], envelope: { to: [to] } };
  }

  const info = await transporter.sendMail({
    from: `"${fromName}" <${user}>`,
    to,
    subject,
    html,
    text,
  });

  // `to` and `subject` only. The body carries the invite/reset link, and a
  // link is the credential — logging it would put a working token in the log
  // file, which the root redaction list cannot help with once it is spliced
  // into an HTML string.
  log.debug({ to, subject, messageId: info.messageId }, 'Mail accepted by SMTP server');

  return info;
};

/**
 * Closes the pooled SMTP connection so shutdown does not wait on an idle
 * socket that the pool would otherwise hold open until Gmail times it out.
 */
const closeMailer = () => {
  transporter.close();
};

export { transporter, sendMail, verifyMailer, closeMailer, isMailConfigured, isMailLogOnly };
export default transporter;
