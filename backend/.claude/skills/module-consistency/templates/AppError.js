/**
 * Operational-error class. Services throw this for every EXPECTED failure —
 * not found, conflict, forbidden, validation — carrying the HTTP status the
 * client should receive alongside a client-safe message.
 *
 * `isOperational` is the flag the global error handler reads to decide
 * whether a message is safe to show. An AppError was raised deliberately by
 * our own code, so its message is intended for the client. Anything else
 * reaching the handler — a TypeError, a Prisma driver failure — is a bug or
 * an outage, and is reported as a generic 500 instead.
 *
 * Throwing rather than responding is the contract: a service has no `res` and
 * must never acquire one. See the WRONG/RIGHT section of the skill.
 *
 * See .claude/skills/module-consistency/SKILL.md
 *      and .claude/skills/api-response/SKILL.md
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

    // Drops this constructor from the trace, so the stack points at the
    // service that threw rather than at this file.
    Error.captureStackTrace(this, this.constructor);
  }
}

export { AppError };
export default AppError;
