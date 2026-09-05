/**
 * Global error handler — the ONLY place in the app that turns an error into
 * an HTTP response. Controllers and services never catch in order to
 * respond; they throw AppError and it lands here.
 *
 * MOUNTED LAST in app.js, after every route and every other middleware.
 * Express identifies an error handler by its FOUR-argument signature, so the
 * unused `next` parameter is load-bearing — remove it and this silently
 * becomes ordinary middleware that never runs.
 *
 * Known vs unknown is the whole job:
 *   - instanceof AppError  → operational. Send err.statusCode and
 *                            err.message as-is; we chose both.
 *   - anything else        → a bug or an outage. Log the real error
 *                            server-side, respond with a generic 500. A
 *                            Prisma message, a stack trace or a driver error
 *                            must never reach a client — it leaks schema,
 *                            file paths and library versions.
 *
 * See .claude/skills/module-consistency/SKILL.md
 *      and .claude/skills/api-response/SKILL.md
 *
 * Lands at: src/shared/middlewares/error.middleware.js
 */

import config from '../../config/env.js';
import AppError from '../utils/AppError.js';
import ApiResponse from '../utils/apiResponse.js';
import httpStatus from '../constants/httpStatus.js';

/**
 * 404 catch-all. Mounted after all routes but before errorHandler, so an
 * unmatched path produces the standard envelope rather than Express's
 * default HTML page.
 */
const notFound = (req, res, next) => {
  next(new AppError(httpStatus.NOT_FOUND, `Route not found: ${req.method} ${req.originalUrl}`));
};

/**
 * Maps Prisma error codes onto the operational errors a client should see.
 * Without this a duplicate email surfaces as a 500 carrying the constraint
 * name — the wrong status and an internal detail leaked in one response.
 * Returns null for codes we have no opinion on; those fall through to the
 * generic 500 path below.
 */
const normalizePrismaError = (err) => {
  switch (err.code) {
    case 'P2002': {
      const target = Array.isArray(err.meta?.target) ? err.meta.target.join(', ') : 'field';
      return new AppError(httpStatus.CONFLICT, `${target} already exists`);
    }
    case 'P2025':
      return new AppError(httpStatus.NOT_FOUND, 'Resource not found');
    case 'P2003':
      return new AppError(httpStatus.BAD_REQUEST, 'Related resource does not exist');
    default:
      return null;
  }
};

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  const error = err?.code?.startsWith?.('P2') ? (normalizePrismaError(err) ?? err) : err;

  // --- KNOWN: operational, raised deliberately by our own code ---
  if (error instanceof AppError) {
    const data = error.details ?? null;

    if (config.nodeEnv === 'development') {
      return ApiResponse.error(res, error.statusCode, error.message, {
        details: data,
        stack: err.stack,
      });
    }

    return ApiResponse.error(res, error.statusCode, error.message, data);
  }

  // --- UNKNOWN: a bug or an outage. Log everything, reveal nothing. ---
  console.error('[error] Unhandled error:', err);

  if (config.nodeEnv === 'development') {
    return ApiResponse.error(res, httpStatus.INTERNAL_SERVER_ERROR, 'Internal server error', {
      stack: err.stack,
    });
  }

  return ApiResponse.error(res, httpStatus.INTERNAL_SERVER_ERROR, 'Internal server error');
};

export { notFound, errorHandler };
export default errorHandler;
