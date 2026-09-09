/**
 * Access-token verification. Issuing tokens belongs to the auth module; this
 * file only checks them, so any module can guard a route without importing from
 * a feature module.
 *
 * **The cookie is read first, the `Authorization` header second.** The browser
 * client is cookie-based — `tizello_access` is `httpOnly`, so a JS client
 * cannot even read it to build a Bearer header. The header path is kept because
 * it costs one line and leaves the door open for a mobile app or a
 * server-to-server caller with no cookie jar; it is a fallback, not a parallel
 * scheme.
 *
 * **`TOKEN_EXPIRED` is distinguished from `TOKEN_INVALID`, and that distinction
 * is a protocol.** The frontend calls `/refresh` on the first and signs the user
 * out on the second. Collapsing both into a generic 401 either strands users
 * with a renewable session or sends them into a refresh loop against a token
 * that will never work.
 *
 * See .claude/specs/auth/auth.sprint3.md §3.4 and docs/api/auth.md
 */

import jwt from 'jsonwebtoken';
import AppError from '../utils/AppError.js';
import httpStatus from '../constants/httpStatus.js';
import { AUTH_CODES } from '../constants/authCodes.js';
import { ACCESS_COOKIE } from '../utils/cookies.js';
import { verifyAccessToken } from '../utils/tokens.js';

/**
 * Pulls the access token from the cookie, falling back to a Bearer header.
 * Returns null when neither is present — "no credential" is not an error here,
 * it is a case `optionalAuthGuard` treats as anonymous.
 */
const extractToken = (req) => {
  const fromCookie = req.cookies?.[ACCESS_COOKIE];
  if (fromCookie) return fromCookie;

  const [scheme, token] = (req.headers.authorization || '').split(' ');
  return scheme === 'Bearer' && token ? token : null;
};

/**
 * Maps a jsonwebtoken failure onto the two codes the frontend branches on.
 * Nothing from the library's own message reaches the client: it names the
 * algorithm and the reason, which is free reconnaissance.
 */
const toAuthError = (error) =>
  error instanceof jwt.TokenExpiredError
    ? new AppError(httpStatus.UNAUTHORIZED, 'Session expired', AUTH_CODES.TOKEN_EXPIRED)
    : new AppError(httpStatus.UNAUTHORIZED, 'Authentication required', AUTH_CODES.TOKEN_INVALID);

const authGuard = (req, res, next) => {
  const token = extractToken(req);

  if (!token) {
    return next(
      new AppError(httpStatus.UNAUTHORIZED, 'Authentication required', AUTH_CODES.TOKEN_INVALID)
    );
  }

  try {
    // verifyAccessToken pins HS256 and allows 60s of clock skew — see
    // shared/utils/tokens.js for why the tolerance is required rather than
    // defensive.
    const decoded = verifyAccessToken(token);

    // `sub` is the registered claim the token is signed with; `id` is the alias
    // the rest of the codebase reads (req.user.id), including permission.js.
    req.user = { id: decoded.sub, ...decoded };

    return next();
  } catch (error) {
    return next(toAuthError(error));
  }
};

/**
 * Like `authGuard`, but never rejects — for routes that serve a signed-in and
 * an anonymous caller from the same handler. A missing or bad token leaves
 * `req.user` undefined and the controller decides what that means.
 */
const optionalAuthGuard = (req, res, next) => {
  const token = extractToken(req);
  if (!token) return next();

  try {
    const decoded = verifyAccessToken(token);
    req.user = { id: decoded.sub, ...decoded };
  } catch {
    // Deliberately swallowed: an expired token on an optional route means
    // "treat them as anonymous", not "fail the request".
  }

  return next();
};

export { authGuard, optionalAuthGuard, extractToken };
export default authGuard;
