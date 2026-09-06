// Centralized Express error handling. This is the ONLY place in the app that
// formats and sends an error response; controllers and services never catch
// to respond, they throw AppError and let it land here. Mounted last, after
// every route.

import config from '../../config/env.js';
import { createLogger } from '../../config/logger.js';
import AppError from '../utils/AppError.js';
import ApiResponse from '../utils/apiResponse.js';
import httpStatus from '../constants/httpStatus.js';
import { AUTH_CODES, codeForStatus } from '../constants/authCodes.js';

const log = createLogger('error');

// 404 catch-all. Mounted after all routes but before errorHandler, so an
// unmatched path produces the same response shape as every other error
// rather than Express's default HTML page.
const notFound = (req, res, next) => {
  next(
    new AppError(
      httpStatus.NOT_FOUND,
      `Route not found: ${req.method} ${req.originalUrl}`,
      AUTH_CODES.NOT_FOUND
    )
  );
};

// Translates Prisma's error codes into the operational errors the client
// should see. Without this, a duplicate email surfaces as a 500 carrying the
// constraint name — the wrong status and an internal detail leaked at once.
const normalizePrismaError = (err) => {
  switch (err.code) {
    case 'P2002': {
      const target = Array.isArray(err.meta?.target) ? err.meta.target.join(', ') : 'field';
      return new AppError(httpStatus.CONFLICT, `${target} already exists`, AUTH_CODES.CONFLICT);
    }
    case 'P2025':
      return new AppError(httpStatus.NOT_FOUND, 'Resource not found', AUTH_CODES.NOT_FOUND);
    case 'P2003':
      return new AppError(
        httpStatus.BAD_REQUEST,
        'Related resource does not exist',
        AUTH_CODES.VALIDATION_ERROR
      );
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

  // `data.code` is the client contract (plan §2.2): the frontend maps the code
  // to its own copy and never renders `message`, so this key must be present on
  // EVERY error — including a Prisma violation or an unhandled throw, which
  // reach here with no code of their own and get one backfilled from the status.
  //
  // Note this shape is the same in development and production. An earlier
  // version replaced `data` with { details, stack } in development, which meant
  // `data.code` existed only in production — the one environment nobody is
  // looking at while building the frontend against it.
  const data = {
    code: (error.isOperational && error.code) || codeForStatus(statusCode),
    ...(error.isOperational && error.details ? { details: error.details } : {}),
    // Stack traces are a development affordance only: in production they
    // disclose file paths, library versions and internal structure.
    ...(config.nodeEnv === 'development' && err.stack ? { stack: err.stack } : {}),
  };

  return ApiResponse.error(res, statusCode, message, data);
};

export { notFound, errorHandler };
export default errorHandler;
