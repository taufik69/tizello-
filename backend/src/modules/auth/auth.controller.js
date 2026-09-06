/**
 * HTTP edge of the auth module: read `req`, call the service, send through
 * `ApiResponse`. No business rules, no Prisma, no `try/catch` — `asyncHandler`
 * at the routes layer forwards a rejection to the error middleware.
 *
 * Controllers here carry one responsibility the service cannot: **cookies**.
 * The service returns tokens as values because it has no `res` and must stay
 * callable from a worker or the OAuth callback; turning those into `Set-Cookie`
 * headers is an HTTP concern and lives at this layer, in exactly one helper
 * (`setAuthCookies`) so no endpoint can set them with different attributes.
 *
 * `userAgent` and `ip` are read here for the same reason — they are properties
 * of a request, and a service that reached for them would no longer be callable
 * without one.
 *
 * See .claude/skills/api-response/SKILL.md and docs/api/auth.md
 */

import ApiResponse from '../../shared/utils/apiResponse.js';
import httpStatus from '../../shared/constants/httpStatus.js';
import {
  setAuthCookies,
  clearAuthCookies,
  ACCESS_COOKIE,
  REFRESH_COOKIE,
} from '../../shared/utils/cookies.js';
import { withMinimumDuration } from '../../shared/utils/timing.js';
import service from './auth.service.js';

const requestContext = (req) => ({
  userAgent: req.get('user-agent') ?? null,
  ip: req.ip ?? null,
});

const register = async (req, res) => {
  const { tokens, ...result } = await service.register({ ...req.body, ...requestContext(req) });

  // Cookies only on the invited path: an ordinary registration issues no
  // session, because the address has not been proved yet (spec §6.1).
  if (tokens) setAuthCookies(res, tokens);

  return ApiResponse.success(res, httpStatus.CREATED, 'Account created', result);
};

const verifyEmail = async (req, res) => {
  const result = await service.verifyEmail(req.body);

  return ApiResponse.success(res, httpStatus.OK, 'Email verified', result);
};

/**
 * Always `202`, and always after the same elapsed time.
 *
 * The uniform status hides whether the address has an account; the padding
 * hides it in the clock, where an unpadded implementation leaks it just as
 * clearly. Both halves are required — see shared/utils/timing.js.
 */
const resendVerification = async (req, res) => {
  await withMinimumDuration(() => service.resendVerification(req.body));

  return ApiResponse.success(res, httpStatus.ACCEPTED, 'If that address has an account, a link is on its way');
};

/**
 * Always `202`, padded — same contract as resend-verification. See
 * shared/utils/timing.js for why the padding is not optional.
 */
const requestLoginCode = async (req, res) => {
  await withMinimumDuration(() => service.requestLoginCode(req.body));

  return ApiResponse.success(
    res,
    httpStatus.ACCEPTED,
    'If that address has an account, a code is on its way'
  );
};

const verifyLoginCode = async (req, res) => {
  const { user, tokens } = await service.verifyLoginCodeAndSignIn({
    ...req.body,
    ...requestContext(req),
  });

  setAuthCookies(res, tokens);

  return ApiResponse.success(res, httpStatus.OK, 'Signed in', { user });
};

const forgotPassword = async (req, res) => {
  await withMinimumDuration(() => service.forgotPassword(req.body));

  return ApiResponse.success(
    res,
    httpStatus.ACCEPTED,
    'If that address has an account, a reset link is on its way'
  );
};

/**
 * `200` and **no session**: possession of a link is not proof of identity
 * (spec §6.4). Cookies are cleared rather than set, because every session for
 * this user was just revoked and leaving a stale cookie in the browser only
 * produces a confusing 401 on the next request.
 */
const resetPassword = async (req, res) => {
  await service.resetPassword(req.body);

  clearAuthCookies(res);

  return ApiResponse.success(res, httpStatus.OK, 'Password updated. Sign in with your new password.');
};

const login = async (req, res) => {
  const { user, tokens } = await service.login({ ...req.body, ...requestContext(req) });

  setAuthCookies(res, tokens);

  return ApiResponse.success(res, httpStatus.OK, 'Signed in', { user });
};

/**
 * Rotates the session.
 *
 * Takes no guard and no body: the refresh cookie IS the credential, and the
 * access token it renews is expected to be expired by the time this is called.
 *
 * Reuse detection is logged here rather than in the service, because `req.log`
 * carries the request id that ties this line to the request that produced it —
 * and this is the single clearest signal of token exfiltration the system
 * emits, so it must be greppable and correlated. The client is told nothing:
 * the response is the same 401 a merely-unknown token gets, because confirming
 * "that token was real once" is itself information.
 */
const refresh = async (req, res, next) => {
  try {
    const { user, tokens } = await service.refresh({
      refreshToken: req.cookies?.[REFRESH_COOKIE],
      ...requestContext(req),
    });

    setAuthCookies(res, tokens);

    return ApiResponse.success(res, httpStatus.OK, 'Session refreshed', { user });
  } catch (error) {
    if (error?.details?.reuseDetected) {
      req.log.warn(
        { userId: error.details.userId, familyId: error.details.familyId },
        'refresh token reuse detected'
      );

      // The forensic detail was for the log, not the client. Strip it before
      // the error middleware turns `details` into `data.details` and hands an
      // attacker confirmation plus a user id.
      error.details = undefined;
    }

    // Whatever the reason, this session is over — clear the cookies so the
    // browser stops re-presenting a token that will never work again.
    clearAuthCookies(res);

    return next(error);
  }
};

const session = async (req, res) => {
  const result = await service.getSession({ userId: req.user.id });

  return ApiResponse.success(res, httpStatus.OK, 'Session', result);
};

/**
 * `204` unconditionally, including for a caller with no cookie at all. Logout
 * is the one endpoint that must never fail: an error here strands a user in a
 * session they cannot leave.
 */
const logout = async (req, res) => {
  await service.logout({
    accessToken: req.cookies?.[ACCESS_COOKIE],
    refreshToken: req.cookies?.[REFRESH_COOKIE],
  });

  clearAuthCookies(res);

  return res.status(httpStatus.NO_CONTENT).end();
};

export default {
  register,
  refresh,
  requestLoginCode,
  verifyLoginCode,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerification,
  login,
  session,
  logout,
};
