/**
 * User endpoints, mounted at `/api/v1/users`.
 *
 * **Every route is `/me`, and there is deliberately no `/:id`.** A profile is
 * edited only by the person it belongs to, and the identity comes from the
 * verified token rather than the path — so there is no id to authorize, no
 * IDOR to get wrong, and no admin path to leave unguarded by accident. Reading
 * *another* member's display fields already has a home: the workspace roster
 * (`GET /workspaces/:workspaceId/members`), which is scoped by a membership
 * the caller has to hold.
 *
 * `apiLimiter` rather than a bespoke one: these are ordinary authenticated
 * reads and writes on the caller's own row, with none of the mail-sending or
 * credential-guessing the tighter limiters exist for.
 *
 * See docs/api/user.md
 */

import express from 'express';

import controller from './user.controller.js';
import { updateProfileSchema } from './user.validator.js';
import validate from '../../shared/middlewares/validate.js';
import asyncHandler from '../../shared/utils/asyncHandler.js';
import { authGuard } from '../../shared/middlewares/auth.js';
import { apiLimiter } from '../../shared/middlewares/rateLimiter.js';

const router = express.Router();

router.get('/me', apiLimiter, authGuard, asyncHandler(controller.me));

// PATCH, not PUT: the body is a partial update — an omitted field means "leave
// it alone", which is exactly what PATCH means and exactly what PUT does not.
router.patch(
  '/me',
  apiLimiter,
  authGuard,
  validate(updateProfileSchema),
  asyncHandler(controller.updateMe)
);

export default router;
