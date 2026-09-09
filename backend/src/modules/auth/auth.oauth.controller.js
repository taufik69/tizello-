/**
 * The OAuth start and callback handlers.
 *
 * **The callback is a redirect endpoint, not a webhook.** The *user's browser*
 * arrives here by `GET`, mid-navigation, carrying `?code=…&state=…`. There is no
 * signature header from the provider to check and no request body. Two
 * consequences run through this file:
 *
 *   1. Every exit is a `302`. Rendering JSON leaves the user staring at a
 *      response body in the middle of signing in.
 *   2. The signed `state` is the *only* thing making the request trustworthy.
 *      Without it the callback accepts any `code` an attacker can get
 *      delivered — that is login-CSRF: the victim is silently signed in to the
 *      **attacker's** account, and everything they do next belongs to the
 *      attacker.
 *
 * `next` travels *inside* the signed state rather than as a query parameter, so
 * it cannot be tampered with — and it is still re-checked as a same-origin
 * relative path on the way out, because a signed open redirect is still an open
 * redirect.
 *
 * See .claude/specs/auth/auth.sprint5.md §5.2, §5.4, §5.6
 */

import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import config from '../../config/env.js';
import passport from '../../config/passport.js';
import { setAuthCookies } from '../../shared/utils/cookies.js';
import { AUTH_CODES } from '../../shared/constants/authCodes.js';
import service from './auth.service.js';

const STATE_TTL_SECONDS = 10 * 60;
const DEFAULT_NEXT = '/board/sprint';

/**
 * Accepts only a same-origin *relative* path.
 *
 * `//evil.com` and `https://evil.com` are both rejected: the first is a
 * protocol-relative URL that browsers happily follow off-site, and it is the
 * one that gets missed by a check for a leading `/` alone. Signing the value
 * proves *we* issued it, not that it is safe to follow.
 */
const safeNext = (value) =>
  typeof value === 'string' && /^\/(?!\/)/.test(value) ? value : DEFAULT_NEXT;

const signState = (next) =>
  jwt.sign({ next: safeNext(next), nonce: crypto.randomUUID() }, config.jwtSecret, {
    expiresIn: STATE_TTL_SECONDS,
    algorithm: 'HS256',
  });

const clientUrl = (path) => `${config.clientOrigin}${path}`;

const failureRedirect = (res, code) =>
  res.redirect(`${config.clientOrigin}/sign-in?error=${encodeURIComponent(code)}`);

/**
 * `GET /api/v1/auth/:provider/start` — signs a state and hands off to the
 * provider.
 */
const start = (provider) => (req, res, next) =>
  passport.authenticate(provider.toLowerCase(), {
    session: false,
    state: signState(req.query.next),
  })(req, res, next);

/**
 * `GET /api/v1/auth/:provider/callback`
 *
 * State is verified **before** Passport runs, so a forged or replayed callback
 * never reaches the token exchange — checking it afterwards would mean we had
 * already spent the code and talked to the provider on an attacker's behalf.
 */
const callback = (provider) => (req, res, next) => {
  let target = DEFAULT_NEXT;

  try {
    target = safeNext(jwt.verify(req.query.state ?? '', config.jwtSecret, {
      algorithms: ['HS256'],
    }).next);
  } catch {
    req.log.warn({ provider }, 'oauth callback with missing or invalid state');
    return failureRedirect(res, AUTH_CODES.TOKEN_INVALID);
  }

  return passport.authenticate(
    provider.toLowerCase(),
    { session: false },
    async (error, user) => {
      // An operational error carries a code the frontend can render (an
      // unverified provider address); anything else is a bug or a provider
      // outage and becomes SERVER_ERROR, never a raw message in a query string.
      if (error || !user) {
        if (error && !error.isOperational) {
          req.log.error({ err: error, provider }, 'oauth callback failed');
        }

        return failureRedirect(res, error?.code ?? AUTH_CODES.OAUTH_EMAIL_UNVERIFIED);
      }

      try {
        const tokens = await service.issueSession({
          user,
          userAgent: req.get('user-agent') ?? null,
          ip: req.ip ?? null,
        });

        setAuthCookies(res, tokens);

        return res.redirect(clientUrl(target));
      } catch (sessionError) {
        req.log.error({ err: sessionError, provider }, 'oauth session issue failed');
        return failureRedirect(res, AUTH_CODES.SERVER_ERROR);
      }
    }
  )(req, res, next);
};

export default { start, callback };
export { start, callback, safeNext };
