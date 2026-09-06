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
 * See .claude/rules/logging.md and src/queues/email.queue.js
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

export { transporter, sendMail, verifyMailer, closeMailer, isMailConfigured };
export default transporter;
