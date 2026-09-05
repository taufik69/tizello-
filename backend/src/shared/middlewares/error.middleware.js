// Centralized Express error handling. This is the ONLY place in the app that
// formats and sends an error response; controllers and services never catch
// to respond, they throw AppError and let it land here. Mounted last, after
// every route.

import config from '../../config/env.js';
import { createLogger } from '../../config/logger.js';
import AppError from '../utils/AppError.js';
import ApiResponse from '../utils/apiResponse.js';
import httpStatus from '../constants/httpStatus.js';

const log = createLogger('error');

// 404 catch-all. Mounted after all routes but before errorHandler, so an
// unmatched path produces the same response shape as every other error
// rather than Express's default HTML page.
const notFound = (req, res, next) => {
  next(new AppError(httpStatus.NOT_FOUND, `Route not found: ${req.method} ${req.originalUrl}`));
};

// Translates Prisma's error codes into the operational errors the client
// should see. Without this, a duplicate email surfaces as a 500 carrying the
// constraint name — the wrong status and an internal detail leaked at once.
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
    // Unexpected errors: log server-side, never leak a stack trace or a raw
    // driver error to the client. `req.log` (attached by the pino-http
    // middleware) is preferred over the module logger because it carries the
    // request id, which is what ties this stack trace to the request line
    // logged beside it; the module logger is the fallback for an error raised
    // before that middleware ran.
    (req.log ?? log).error({ err }, 'Unhandled error');
  }

  const data = error.isOperational ? (error.details ?? null) : null;

  if (config.nodeEnv === 'development') {
    return ApiResponse.error(res, statusCode, message, { details: data, stack: err.stack });
  }

  return ApiResponse.error(res, statusCode, message, data);
};

export { notFound, errorHandler };
export default errorHandler;
