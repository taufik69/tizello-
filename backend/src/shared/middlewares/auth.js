// JWT verification only — issuing tokens belongs to the auth module, not
// here. This file exists so any module can guard a route without importing
// from a feature module.

import jwt from 'jsonwebtoken';
import config from '../../config/env.js';
import AppError from '../utils/AppError.js';
import httpStatus from '../constants/httpStatus.js';

// Verifies the `Authorization: Bearer <token>` header using the secret from
// config/env.js (never process.env directly). On success, attaches the
// decoded payload to req.user.
const authGuard = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || '';
    const [scheme, token] = authHeader.split(' ');

    if (scheme !== 'Bearer' || !token) {
      throw new AppError(httpStatus.UNAUTHORIZED, 'Authentication required');
    }

    const decoded = jwt.verify(token, config.jwtSecret);

    req.user = { id: decoded.id ?? decoded.sub, ...decoded };

    next();
  } catch (error) {
    if (error instanceof AppError) {
      return next(error);
    }
    // jwt.verify throws on an invalid or expired token — surface it as a
    // client-safe 401 rather than leaking the library's message.
    next(new AppError(httpStatus.UNAUTHORIZED, 'Authentication required'));
  }
};

// Like authGuard, but never rejects — for routes that serve both a signed-in
// and an anonymous caller. A missing or bad token simply leaves req.user
// undefined and the controller decides what that means.
const optionalAuthGuard = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || '';
    const [scheme, token] = authHeader.split(' ');

    if (scheme !== 'Bearer' || !token) {
      return next();
    }

    const decoded = jwt.verify(token, config.jwtSecret);
    req.user = { id: decoded.id ?? decoded.sub, ...decoded };

    next();
  } catch {
    next();
  }
};

export { authGuard, optionalAuthGuard };
export default authGuard;
