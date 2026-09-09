// Shared operational-error class. Services throw this for known failure
// cases (not found, validation failure, conflict, unauthorized, ...). The
// centralized error middleware (shared/middlewares/error.middleware.js) is the only
// place these are turned into HTTP responses.

class AppError extends Error {
  constructor(statusCode, message, details) {
    super(message);
    this.statusCode = statusCode;
    this.details = details; // optional structured detail
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export { AppError };
export default AppError;
