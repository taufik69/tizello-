/**
 * Shared operational-error class. Services throw this for known failure cases
 * (not found, validation failure, conflict, unauthorized, …). The centralized
 * error middleware (shared/middlewares/error.middleware.js) is the only place
 * these are turned into HTTP responses.
 *
 * `code` is the third argument, ahead of `details`, because it is the field the
 * client actually branches on. The frontend maps `data.code` to its own copy
 * and never renders `message` (plan §2.2) — so an error thrown without a code
 * is not merely terse, it is unrenderable: the UI has no branch for it. The
 * error middleware backfills one from the status when a throw omits it, but
 * that fallback picks a code from a status table rather than from the thing
 * that failed, which is nearly always the wrong one.
 *
 *   throw new AppError(httpStatus.UNAUTHORIZED, 'Invalid credentials', AUTH_CODES.INVALID_CREDENTIALS);
 *
 * `details` stays last and stays optional: it carries field-level validation
 * errors, which are per-field detail *under* a form-level code, never a
 * replacement for one.
 *
 * See .claude/rules/error-handling.md
 *      and .claude/skills/api-response/SKILL.md
 */

class AppError extends Error {
  constructor(statusCode, message, code, details) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    // Distinguishes "we chose this failure" from "something threw". The error
    // middleware sends an operational error's own message and swallows
    // everything else behind a generic 500 — a bug's message can name a table,
    // a file path or a library version.
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export { AppError };
export default AppError;
