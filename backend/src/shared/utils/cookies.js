/**
 * The two auth cookies, set and cleared in exactly one place.
 *
 * **The refresh cookie's `path` is the highest-value line in the whole auth
 * design** (plan §4.1). Scoped to `/api/v1/auth/refresh`, the browser attaches
 * the refresh token to that one endpoint and to nothing else — so a successful
 * XSS on any other route can read neither cookie (both are `httpOnly`) *and*
 * cannot cause the refresh token to be sent anywhere it could be observed. Set
 * it to `/` and nothing fails, no test goes red, and the blast radius of every
 * future XSS silently doubles. That is why it is a constant here rather than an
 * argument.
 *
 * The two cookies get different `sameSite` values on purpose:
 *   - access  → `lax`,    so a normal top-level navigation into the app is
 *                         still authenticated.
 *   - refresh → `strict`, because it is only ever sent by the app's own fetch
 *                         to one endpoint; no cross-site context has any
 *                         legitimate reason to trigger it, and `strict` closes
 *                         the CSRF path to token rotation.
 *
 * Clearing must repeat the same `path`, `sameSite` and `domain` the cookie was
 * set with. A browser matches on those attributes, so a mismatched clear is a
 * silent no-op: the user believes they signed out and the cookie is still on
 * the machine.
 *
 * See .claude/specs/auth/auth.sprint1.md §1.4 and .claude/plan/authentication.md §4.1, §11.1
 */

import config from '../../config/env.js';

const ACCESS_COOKIE = 'tizello_access';
const REFRESH_COOKIE = 'tizello_refresh';

/**
 * The refresh endpoint, and the only path the refresh cookie is sent to.
 * Changing this string without changing the route (or the reverse) logs every
 * user out at their next refresh, because the cookie stops being attached.
 */
const REFRESH_COOKIE_PATH = '/api/v1/auth/refresh';

const MINUTE = 60 * 1000;
const DAY = 24 * 60 * MINUTE;

/**
 * `Secure` is derived, never configured. Local development is plain http and a
 * `Secure` cookie is dropped there without an error — the request simply
 * arrives with no cookie, which presents as "login does nothing". Tying it to
 * NODE_ENV means production cannot accidentally ship without it, and
 * development cannot accidentally ship with it.
 */
const baseOptions = {
  httpOnly: true,
  secure: config.nodeEnv === 'production',
  domain: config.cookieDomain,
};

const accessCookieOptions = {
  ...baseOptions,
  sameSite: 'lax',
  path: '/',
  maxAge: 15 * MINUTE,
};

const refreshCookieOptions = {
  ...baseOptions,
  sameSite: 'strict',
  path: REFRESH_COOKIE_PATH,
  maxAge: config.auth.refreshTokenTtlDays * DAY,
};

/**
 * Sets both cookies. Callers pass whichever they have — the OAuth callback and
 * every sign-in path set both, but a refresh rotation that only re-issues one
 * would pass one.
 */
const setAuthCookies = (res, { accessToken, refreshToken }) => {
  if (accessToken) res.cookie(ACCESS_COOKIE, accessToken, accessCookieOptions);
  if (refreshToken) res.cookie(REFRESH_COOKIE, refreshToken, refreshCookieOptions);
};

/**
 * Clears both cookies, repeating the attributes they were set with (minus
 * `maxAge`, which `clearCookie` replaces with an expiry in the past).
 */
const clearAuthCookies = (res) => {
  const { maxAge: _accessMaxAge, ...accessAttributes } = accessCookieOptions;
  const { maxAge: _refreshMaxAge, ...refreshAttributes } = refreshCookieOptions;

  res.clearCookie(ACCESS_COOKIE, accessAttributes);
  res.clearCookie(REFRESH_COOKIE, refreshAttributes);
};

export {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  REFRESH_COOKIE_PATH,
  setAuthCookies,
  clearAuthCookies,
  accessCookieOptions,
  refreshCookieOptions,
};
