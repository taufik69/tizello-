/**
 * Invitation endpoints, in **two scopes** (§6.9).
 *
 * Admin routes are workspace-scoped and carry `:workspaceId` in the path,
 * because `permission.js` resolves the caller's membership from
 * `(userId, workspaceId)` — the workspace has to be in the path for the
 * permission check to have anything to check against.
 *
 * Recipient routes are token-scoped and mounted at `/api/v1/invitations`. The
 * lookup takes **no guard at all**: the recipient has no account yet, which is
 * the entire situation the endpoint exists for.
 *
 * See docs/api/invitation.md
 */

import express from 'express';

import controller from './invitation.controller.js';
import {
  createInvitationSchema,
  workspaceParamsSchema,
  invitationParamsSchema,
  tokenParamsSchema,
} from './invitation.validator.js';
import validate from '../../shared/middlewares/validate.js';
import asyncHandler from '../../shared/utils/asyncHandler.js';
import { authGuard } from '../../shared/middlewares/auth.js';
import { loadMembership, requirePermission } from '../../shared/middlewares/permission.js';
import { inviteSendLimiter, inviteLookupLimiter, apiLimiter } from '../../shared/middlewares/rateLimiter.js';
import { PERMISSIONS } from '../../shared/constants/roles.js';

/* ── Admin: /api/v1/workspaces/:workspaceId/invitations ─────────────────── */

// `mergeParams` is load-bearing: without it `req.params.workspaceId` is
// undefined inside this router, so loadMembership cannot resolve a membership
// and every request 400s on a workspace id that is right there in the URL.
const workspaceRouter = express.Router({ mergeParams: true });

// Order: limit → guard → membership → permission → validate. The limiter is
// keyed on the workspace, so it must run before anything can reject; validation
// runs last so a caller who may not act here is refused before their payload is
// parsed.
workspaceRouter.post(
  '/',
  inviteSendLimiter,
  authGuard,
  validate(workspaceParamsSchema, 'params'),
  loadMembership,
  requirePermission(PERMISSIONS.MEMBER_INVITE),
  validate(createInvitationSchema),
  asyncHandler(controller.create)
);

workspaceRouter.get(
  '/',
  authGuard,
  validate(workspaceParamsSchema, 'params'),
  loadMembership,
  requirePermission(PERMISSIONS.MEMBER_VIEW),
  asyncHandler(controller.list)
);

workspaceRouter.delete(
  '/:id',
  apiLimiter,
  authGuard,
  validate(invitationParamsSchema, 'params'),
  loadMembership,
  requirePermission(PERMISSIONS.MEMBER_INVITE),
  asyncHandler(controller.revoke)
);

workspaceRouter.post(
  '/:id/resend',
  inviteSendLimiter,
  authGuard,
  validate(invitationParamsSchema, 'params'),
  loadMembership,
  requirePermission(PERMISSIONS.MEMBER_INVITE),
  asyncHandler(controller.resend)
);

/* ── Recipient: /api/v1/invitations ─────────────────────────────────────── */

const tokenRouter = express.Router();

tokenRouter.get(
  '/:token',
  inviteLookupLimiter,
  validate(tokenParamsSchema, 'params'),
  asyncHandler(controller.lookup)
);

tokenRouter.post(
  '/:token/accept',
  apiLimiter,
  authGuard,
  validate(tokenParamsSchema, 'params'),
  asyncHandler(controller.accept)
);

tokenRouter.post(
  '/:token/decline',
  apiLimiter,
  authGuard,
  validate(tokenParamsSchema, 'params'),
  asyncHandler(controller.decline)
);

export { workspaceRouter, tokenRouter };
export default tokenRouter;
