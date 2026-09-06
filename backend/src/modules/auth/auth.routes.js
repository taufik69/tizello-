/**
 * Auth endpoints. Middleware order is the security contract, not a style
 * choice, and reads left to right as: *limit → validate → guard → handle*.
 *
 * The limiter is first on every credential path deliberately. Put it after
 * validation and an attacker's malformed guesses never touch the counter, so
 * the limit only ever applies to well-formed traffic — which is not where the
 * volume comes from.
 *
 * Two routes break the module's usual pattern, both on purpose:
 *   - `/logout` takes **no guard** (§2.7). Logging out with an expired access
 *     token must still clear cookies.
 *   - `/refresh` takes no guard either: the cookie *is* the credential, and the
 *     access token it renews is expected to be expired by the time it is called.
 *
 * See .claude/skills/module-consistency/SKILL.md and docs/api/auth.md
 */

import express from 'express';

import controller from './auth.controller.js';
import oauthController from './auth.oauth.controller.js';
import { isProviderEnabled } from '../../config/passport.js';
import {
  registerSchema,
  loginSchema,
  verifyEmailSchema,
  resendVerificationSchema,
  requestCodeSchema,
  verifyCodeSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from './auth.validator.js';
import validate from '../../shared/middlewares/validate.js';
import asyncHandler from '../../shared/utils/asyncHandler.js';
import { authGuard } from '../../shared/middlewares/auth.js';
import {
  authLimiter,
  registerLimiter,
  resendLimiter,
  refreshLimiter,
  recoveryLimiter,
  oauthLimiter,
} from '../../shared/middlewares/rateLimiter.js';

const router = express.Router();

router.post(
  '/register',
  registerLimiter,
  validate(registerSchema),
  asyncHandler(controller.register)
);

router.post(
  '/verify-email',
  authLimiter,
  validate(verifyEmailSchema),
  asyncHandler(controller.verifyEmail)
);

router.post(
  '/resend-verification',
  resendLimiter,
  validate(resendVerificationSchema),
  asyncHandler(controller.resendVerification)
);

router.post('/login', authLimiter, validate(loginSchema), asyncHandler(controller.login));

// Code-first sign-in: /login/request-code then /login/verify-code. Mounted
// before /login would be harmless (they do not overlap), but they are grouped
// here because they are one flow, and the frontend's two-step form is built
// around it being the default.
router.post(
  '/login/request-code',
  recoveryLimiter,
  validate(requestCodeSchema),
  asyncHandler(controller.requestLoginCode)
);

router.post(
  '/login/verify-code',
  authLimiter,
  validate(verifyCodeSchema),
  asyncHandler(controller.verifyLoginCode)
);

router.post(
  '/forgot-password',
  recoveryLimiter,
  validate(forgotPasswordSchema),
  asyncHandler(controller.forgotPassword)
);

router.post(
  '/reset-password',
  authLimiter,
  validate(resetPasswordSchema),
  asyncHandler(controller.resetPassword)
);

// The path here must stay byte-identical to REFRESH_COOKIE_PATH in
// shared/utils/cookies.js. They are two halves of one decision: the cookie is
// scoped to exactly this URL, so renaming either one alone means the browser
// stops attaching the token and every session dies at its first rotation.
router.post('/refresh', refreshLimiter, asyncHandler(controller.refresh));

router.get('/session', authGuard, asyncHandler(controller.session));

// No guard, no validator — see the header.
router.post('/logout', asyncHandler(controller.logout));

/* ── OAuth ──────────────────────────────────────────────────────────────
 *
 * The paths are PINNED by the provider consoles: the GitHub OAuth App and the
 * Google client each store the callback URL and compare it to what we send
 * character for character. Renaming a route here without editing both consoles
 * breaks sign-in at the *provider*, before any of our code runs, so nothing in
 * our logs explains it. Note there is no `/oauth` segment — see sprint 5 §5.6.
 *
 * Registered per provider rather than as `/:provider`, on purpose: a
 * parameterized route directly under /api/v1/auth sits one segment from
 * /login, /refresh and /session and would shadow any future sibling. Two
 * explicit pairs cost four lines and cannot collide.
 *
 * A provider with no credentials registers nothing, so its routes 404 rather
 * than throwing "Unknown authentication strategy" as a 500 (plan §11).
 */
for (const provider of ['google', 'github']) {
  if (!isProviderEnabled(provider)) continue;

  router.get(`/${provider}/start`, oauthLimiter, oauthController.start(provider));
  router.get(`/${provider}/callback`, oauthLimiter, oauthController.callback(provider));
}

export default router;
