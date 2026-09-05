/**
 * Shared operational-error class. Services throw this for every known failure
 * case — not found, validation failure, conflict, unauthorized — carrying the
 * HTTP status the client should see alongside the message.
 *
 * Throwing rather than responding is the whole contract: a service has no
 * `res` and must never acquire one. The centralized error middleware
 * (src/shared/middlewares/error.middleware.js) is the single place these become HTTP
 * responses, via ApiResponse.error.
 *
 * `isOperational` marks errors we raised deliberately and whose message is
 * safe to show a client. Anything without it — a TypeError, a driver failure —
 * is logged server-side and reported as a generic 500, so an internal detail
 * never leaks just because it reached the same handler.
 *
 * See .claude/skills/api-response/SKILL.md
 *
 * Lands at: src/shared/utils/AppError.js
 */

class AppError extends Error {
  /**
   * @param {number} statusCode  HTTP status the client should receive.
   * @param {string} message     Client-safe message. Assume it is displayed.
   * @param {*}      [details]   Optional structured detail — e.g. the
   *                             { field, message } pairs from validation.
   *                             Becomes the response's `data`.
   */
  constructor(statusCode, message, details) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true;

    // Drops this constructor from the captured stack, so the trace points at
    // the service that threw rather than at this file.
    Error.captureStackTrace(this, this.constructor);
  }
}

export { AppError };
export default AppError;
