// Common HTTP status codes used across the project. Plain constants object —
// no library currently provides this.

const httpStatus = {
  OK: 200,
  CREATED: 201,
  // The auth surface uses 202 for the three endpoints that answer identically
  // whether or not the address exists: work may have been queued, and saying
  // more than that would leak which branch ran.
  ACCEPTED: 202,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  // Used by the auth surface for an expired-but-once-valid token or code.
  // Distinct from 400 TOKEN_INVALID because the frontend offers 'send me a
  // new link' for this one and not for a token that never existed.
  GONE: 410,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
};

export default httpStatus;
