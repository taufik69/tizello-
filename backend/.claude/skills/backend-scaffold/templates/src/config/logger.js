/**
 * The single logger for the whole backend — a pino root logger plus the
 * `logger.child({ tag })` helper every other file uses.
 *
 * Nothing outside this file calls `console.*`. Console writes are
 * unstructured, unleveled and synchronous on a pipe, so they cannot be
 * filtered by severity, shipped to a log aggregator, or silenced in tests —
 * three things a running service needs and a `console.log` can never grow
 * into. Pretty-printing is development-only and deliberate: the transport
 * costs a worker thread and turns machine-readable NDJSON into something a
 * log collector has to re-parse, so production emits raw JSON on stdout and
 * lets the platform collect it.
 *
 * Usage — one child per subsystem, carrying the `[tag]` the scaffold
 * convention already uses in its messages:
 *
 *   import { createLogger } from '../config/logger.js';
 *   const log = createLogger('db');
 *   log.info('Postgres connected successfully');
 *   log.error({ err }, 'Postgres connection failed');
 *
 * pino's first argument is the merge object, not the message: pass the error
 * as `{ err }` (never string-concatenated into the message) so the serializer
 * records type, message and stack as structured fields.
 *
 * See .claude/skills/backend-scaffold/SKILL.md
 *      and .claude/rules/error-handling.md
 */

import pino from 'pino';
import config from './env.js';

const isProduction = config.nodeEnv === 'production';

const logger = pino({
  level: config.logLevel,
  // `err` and `req`/`res` get pino's standard serializers; without the
  // explicit `err` entry an Error passed as `{ err }` logs as `{}` because
  // its own properties are non-enumerable.
  serializers: {
    err: pino.stdSerializers.err,
  },
  // Redaction is applied at the root so it holds for every child logger —
  // a child cannot opt out, which is the point. These paths are the ones a
  // request logger would otherwise write verbatim into the log.
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'res.headers["set-cookie"]',
      'password',
      '*.password',
      'passwordHash',
      '*.passwordHash',
      'token',
      '*.token',
    ],
    censor: '[redacted]',
  },
  // ISO timestamps rather than pino's default epoch millis: these logs are
  // read by humans in development and correlated with Postgres/Redis logs in
  // production, both of which speak ISO.
  timestamp: pino.stdTimeFunctions.isoTime,
  base: { pid: process.pid },
  ...(isProduction
    ? {}
    : {
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'HH:MM:ss.l',
            // `tag` is ignored as a field because messageFormat below already
            // renders it as the line's prefix — left in, pino-pretty prints it
            // a second time as a child property under every line.
            ignore: 'pid,hostname,tag',
            // Renders the child's `tag` binding as the `[db]`/`[redis]`
            // prefix the rest of the codebase and its docs refer to.
            messageFormat: '[{tag}] {msg}',
          },
        },
      }),
});

/**
 * Awaits the log transport draining, for use immediately before
 * `process.exit()`.
 *
 * In development pino writes through a pino-pretty worker thread, and
 * `process.exit()` tears the process down without waiting for it — so the
 * last line before an exit, which is exactly the line explaining *why* the
 * process is exiting, is the one most likely to be lost. The timeout keeps a
 * wedged transport from turning a fast crash into a hang.
 */
const flushLogger = (timeoutMs = 500) =>
  new Promise((resolve) => {
    const done = setTimeout(resolve, timeoutMs);
    logger.flush(() => {
      clearTimeout(done);
      resolve();
    });
  });

/**
 * A child logger bound to one subsystem tag — `server`, `db`, `redis`,
 * `http`, `email-worker`.
 *
 * Always prefer this over the root logger: the tag is what makes a line
 * greppable and what the pretty transport renders as the `[tag]` prefix.
 */
const createLogger = (tag) => logger.child({ tag });

export { logger, createLogger, flushLogger };
export default logger;
