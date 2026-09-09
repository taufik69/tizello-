/**
 * Workspace endpoints. Order per request: limiter → guard → validate →
 * handler, matching `auth.routes.js`.
 *
 * `create` and `list` carry no `loadMembership` — there is no `:workspaceId`
 * yet for create, and list is scoped to the caller's own memberships inside
 * the service rather than to one workspace. Every other route is
 * `loadMembership` first (proves membership, resolves `req.membership`),
 * then `requirePermission` where the action needs more than plain
 * membership.
 *
 * See docs/api/workspace.md
 */

import express from 'express';

import controller from './workspace.controller.js';
import {
  createWorkspaceSchema,
  updateWorkspaceSchema,
  archiveWorkspaceSchema,
  listWorkspacesQuerySchema,
} from './workspace.validator.js';
import validate from '../../shared/middlewares/validate.js';
import asyncHandler from '../../shared/utils/asyncHandler.js';
import { authGuard } from '../../shared/middlewares/auth.js';
import { loadMembership, requirePermission } from '../../shared/middlewares/permission.js';
import { PERMISSIONS } from '../../shared/constants/roles.js';

const router = express.Router();

router.post(
  '/',
  authGuard,
  validate(createWorkspaceSchema),
  asyncHandler(controller.create)
);

router.get(
  '/',
  authGuard,
  validate(listWorkspacesQuerySchema, 'query'),
  asyncHandler(controller.list)
);

router.get('/:workspaceId', authGuard, loadMembership, asyncHandler(controller.getById));

/*
 * The roster is NOT here. `GET /workspaces/:workspaceId/members` moved to
 * `src/modules/member/member.routes.js` — same path, same response — because
 * that module owns the roster's writes too. See docs/api/member.md §1.
 */

router.patch(
  '/:workspaceId',
  authGuard,
  loadMembership,
  requirePermission(PERMISSIONS.WORKSPACE_UPDATE),
  validate(updateWorkspaceSchema),
  asyncHandler(controller.update)
);

router.patch(
  '/:workspaceId/archive',
  authGuard,
  loadMembership,
  requirePermission(PERMISSIONS.WORKSPACE_UPDATE),
  validate(archiveWorkspaceSchema),
  asyncHandler(controller.archive)
);

router.delete(
  '/:workspaceId',
  authGuard,
  loadMembership,
  requirePermission(PERMISSIONS.WORKSPACE_DELETE),
  asyncHandler(controller.remove)
);

export default router;
