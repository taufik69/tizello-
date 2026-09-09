/**
 * Member endpoints, mounted at `/api/v1/workspaces/:workspaceId/members` from
 * `src/routes/index.js`.
 *
 * Workspace-scoped by necessity, not by taste: `permission.js` resolves the
 * caller's membership from `(userId, workspaceId)`, so the workspace has to be
 * in the path for the permission check to have anything to check against.
 *
 * `mergeParams` is load-bearing — without it `req.params.workspaceId` is
 * undefined inside this router, so `loadMembership` cannot resolve a membership
 * and every request 400s on a workspace id that is visibly right there in the
 * URL. The same trap `invitation.routes.js` documents.
 *
 * There is deliberately no `POST /`. The only way into a workspace is an
 * invitation the recipient accepts (`docs/api/invitation.md` §1, §6): a
 * `POST /members` taking a `userId` would put somebody in a workspace without
 * their consent, and would need a user-lookup-by-email endpoint to be usable —
 * an account-enumeration oracle built to serve a feature nobody asked for.
 *
 * See docs/api/member.md
 */

import express from 'express';

import controller from './member.controller.js';
import {
  updateRoleSchema,
  memberParamsSchema,
  workspaceParamsSchema,
} from './member.validator.js';
import validate from '../../shared/middlewares/validate.js';
import asyncHandler from '../../shared/utils/asyncHandler.js';
import { authGuard } from '../../shared/middlewares/auth.js';
import { loadMembership, requirePermission } from '../../shared/middlewares/permission.js';
import { apiLimiter } from '../../shared/middlewares/rateLimiter.js';
import { PERMISSIONS } from '../../shared/constants/roles.js';

const router = express.Router({ mergeParams: true });

// No limiter on the read: an authenticated read of a bounded list, already
// behind `loadMembership`. Same call as every authenticated read in
// `workspace.routes.js`, which is where this route lived until now.
router.get(
  '/',
  authGuard,
  validate(workspaceParamsSchema, 'params'),
  loadMembership,
  requirePermission(PERMISSIONS.MEMBER_VIEW),
  asyncHandler(controller.list)
);

// Order on both writes: limiter → guard → params → membership → permission →
// body. The limiter runs before anything can reject, and body validation runs
// LAST so a caller who may not act here is refused before their payload is
// parsed — matching `invitation.routes.js`.
router.patch(
  '/:memberId',
  apiLimiter,
  authGuard,
  validate(memberParamsSchema, 'params'),
  loadMembership,
  requirePermission(PERMISSIONS.MEMBER_ROLE_UPDATE),
  validate(updateRoleSchema),
  asyncHandler(controller.updateRole)
);

router.delete(
  '/:memberId',
  apiLimiter,
  authGuard,
  validate(memberParamsSchema, 'params'),
  loadMembership,
  requirePermission(PERMISSIONS.MEMBER_REMOVE),
  asyncHandler(controller.remove)
);

export default router;
