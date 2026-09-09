// express-rate-limit instances shared across modules, so no route invents
// its own window. Responses go through ApiResponse to keep the error shape
// identical to every other failure the client can see.

import rateLimit from 'express-rate-limit';
import ApiResponse from '../utils/apiResponse.js';
import httpStatus from '../constants/httpStatus.js';

const handler = (req, res) =>
  ApiResponse.error(res, httpStatus.TOO_MANY_REQUESTS, 'Too many requests, please try again later');

// General write-endpoint limiter.
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  handler,
});

// Tighter limit for credential endpoints (login, password reset, invitation
// acceptance) — these are the ones worth guessing at.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler,
});

export { apiLimiter, authLimiter };
