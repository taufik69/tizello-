/**
 * Centralized Express error-handling middleware. This is the ONLY place in the
 * app that formats and sends an error response — controllers and services
 * never catch in order to respond, they throw AppError and let it land here.
 *
 * Mounted LAST in app.js, after every route and after the 404 catch-all.
 * Express identifies an error handler by its four-argument signature, so the
 * unused `next` parameter is load-bearing: remove it and this silently stops
 * being an error handler.
 *
 * Two classes of error arrive here:
 *   - operational (AppError): the message and details are client-safe and are
 *     sent as-is with the status the service chose.
 *   - everything else: logged in full server-side, reported as a generic 500
 *     with no details, so a stack trace or driver message never reaches a
 *     client.
 *
 * See .claude/skills/api-response/SKILL.md
 *
 * Lands at: src/shared/middlewares/error.middleware.js
 */

import config from '../../config/env.js';
import AppError from '../utils/AppError.js';
import ApiResponse from '../utils/apiResponse.js';
import httpStatus from '../constants/httpStatus.js';

/**
 * 404 catch-all. Mounted after all routes but before errorHandler, so an
 * unmatched path produces the standard envelope instead of Express's default
 * HTML error page.
 */
const notFound = (req, res, next) => {
  next(new AppError(httpStatus.NOT_FOUND, `Route not found: ${req.method} ${req.originalUrl}`));
};

/**
 * Translates Prisma's error codes into the operational errors a client should
 * see. Without this a duplicate email surfaces as a 500 carrying the constraint
 * name — the wrong status and an internal detail leaked in one response.
 * Returns null for codes we have no opinion on, which fall through to the
 * generic 500 path.
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

  const statusCode = error.statusCode || httpStatus.INTERNAL_SERVER_ERROR;
  const message = error.isOperational ? error.message : 'Something went wrong';

  if (!error.isOperational) {
    console.error('[error] Unhandled error:', err);
  }

  const data = error.isOperational ? (error.details ?? null) : null;

  // Stack traces are a development-only debugging aid, layered on top of the
  // normal shape — never sent in any other environment.
  if (config.nodeEnv === 'development') {
    return ApiResponse.error(res, statusCode, message, { details: data, stack: err.stack });
  }

  return ApiResponse.error(res, statusCode, message, data);
};

export { notFound, errorHandler };
export default errorHandler;
