/**
 * HTTP request logging — pino-http, mounted once in app.js. Replaces morgan.
 *
 * It does two jobs, and the second is the one that matters: besides writing
 * one completion line per request, it attaches `req.log`, a child logger
 * already carrying that request's id. Logging through `req.log` inside a
 * controller is what lets a line be traced back to the request that produced
 * it; logging through the root logger loses that link.
 *
 * The level of a completion line is derived from the status code rather than
 * fixed, so a 500 is greppable as an error even though the request itself
 * completed normally from Express's point of view.
 *
 * Health checks are logged at `debug`: an uptime probe hitting /health every
 * few seconds would otherwise be most of the log volume in production and
 * bury the requests someone actually wants to read.
 *
 * See src/config/logger.js and .claude/skills/backend-scaffold/SKILL.md
 */

import pinoHttp from 'pino-http';
import { randomUUID } from 'node:crypto';

import { createLogger } from '../../config/logger.js';

const url = (req) => req.originalUrl ?? req.url;
const path = (req) => url(req).split('?')[0];

const httpLogger = pinoHttp({
  logger: createLogger('http'),

  // Honour an upstream correlation id when a proxy or the frontend sends one,
  // so one id follows a request across services; mint one otherwise. pino-http
  // also echoes this back as the `x-request-id` response header.
  genReqId: (req, res) => {
    const existing = req.headers['x-request-id'];
    const id = typeof existing === 'string' && existing.length > 0 ? existing : randomUUID();
    res.setHeader('x-request-id', id);
    return id;
  },

  // `originalUrl`, never `req.url`: Express strips a router's mount path off
  // `req.url` while dispatching, so by the time the response finishes a
  // request to /health reads as "/" — which silently defeats both the health
  // suppression below and the message.
  customLogLevel: (req, res, err) => {
    if (err || res.statusCode >= 500) return 'error';
    if (res.statusCode >= 400) return 'warn';
    if (path(req) === '/health') return 'debug';
    return 'info';
  },

  customSuccessMessage: (req, res) => `${req.method} ${url(req)} ${res.statusCode}`,
  customErrorMessage: (req, res, err) =>
    `${req.method} ${url(req)} ${res.statusCode} — ${err.message}`,

  // Trimmed serializers. The defaults log every request header on every line;
  // these keep what is useful for debugging and drop the rest. Authorization
  // and cookie headers are redacted at the root logger, so they cannot come
  // back through this path either.
  serializers: {
    req: (req) => ({
      id: req.id,
      method: req.method,
      url: req.originalUrl ?? req.url,
      remoteAddress: req.remoteAddress,
    }),
    res: (res) => ({ statusCode: res.statusCode }),
  },
});

export default httpLogger;
