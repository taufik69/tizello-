/**
 * Project endpoints, in **two scopes**.
 *
 * Create and list are workspace-scoped and carry `:workspaceId` in the path,
 * because `permission.js` resolves the caller's membership from
 * `(userId, workspaceId)` — the workspace has to be in the path for the
 * permission check to have anything to check against, and on create there is
 * no project yet to scope one to.
 *
 * Everything else is project-scoped and mounted at `/api/v1/projects`: a
 * project id is globally unique, and making a client carry the workspace id it
 * can already read off the project would be noise. Same split as
 * `invitation.routes.js`.
 *
 * Order per request: limiter -> guard -> membership/project -> role guard ->
 * validate -> handler, matching every sibling module.
 *
 * See docs/api/project.md
 */

import express from 'express';

import controller from './project.controller.js';
import {
  createProjectSchema,
  updateProjectSchema,
  archiveProjectSchema,
  listProjectsQuerySchema,
  addProjectMemberSchema,
  updateProjectMemberSchema,
  listMembersQuerySchema,
  transferOwnershipSchema,
} from './project.validator.js';
import validate from '../../shared/middlewares/validate.js';
import asyncHandler from '../../shared/utils/asyncHandler.js';
import { authGuard } from '../../shared/middlewares/auth.js';
import { loadMembership, requirePermission } from '../../shared/middlewares/permission.js';
import {
  loadProject,
  requireProjectWrite,
  requireProjectOwner,
} from '../../shared/middlewares/project.js';
import { PERMISSIONS } from '../../shared/constants/roles.js';
import { apiLimiter, projectCreateLimiter } from '../../shared/middlewares/rateLimiter.js';

/* ── Workspace-scoped: /api/v1/workspaces/:workspaceId/projects ─────────── */

// `mergeParams` is load-bearing: without it `req.params.workspaceId` is
// undefined inside this router, so `loadMembership` cannot resolve a membership
// and every request 400s on a workspace id that is right there in the URL.
const workspaceRouter = express.Router({ mergeParams: true });

workspaceRouter.post(
  '/',
  projectCreateLimiter,
  authGuard,
  loadMembership,
  requirePermission(PERMISSIONS.PROJECT_CREATE),
  validate(createProjectSchema),
  asyncHandler(controller.create)
);

workspaceRouter.get(
  '/',
  apiLimiter,
  authGuard,
  loadMembership,
  requirePermission(PERMISSIONS.PROJECT_VIEW),
  validate(listProjectsQuerySchema, 'query'),
  asyncHandler(controller.list)
);

/* ── Project-scoped: /api/v1/projects ───────────────────────────────────── */

const projectRouter = express.Router();

// No `requirePermission` here: `loadProject` already proved workspace
// membership, and every workspace role may read every project in it (plan
// §2.5 step 4).
projectRouter.get(
  '/:projectId',
  apiLimiter,
  authGuard,
  loadProject,
  asyncHandler(controller.getById)
);

projectRouter.patch(
  '/:projectId',
  apiLimiter,
  authGuard,
  loadProject,
  requireProjectWrite,
  validate(updateProjectSchema),
  asyncHandler(controller.update)
);

projectRouter.patch(
  '/:projectId/archive',
  apiLimiter,
  authGuard,
  loadProject,
  requireProjectWrite,
  validate(archiveProjectSchema),
  asyncHandler(controller.archive)
);

// Stricter than the two above: a MANAGER may edit a project, only its owner
// (or a workspace OWNER/ADMIN) may delete it.
projectRouter.delete(
  '/:projectId',
  apiLimiter,
  authGuard,
  loadProject,
  requireProjectOwner,
  asyncHandler(controller.remove)
);


/* ── Members and ownership ──────────────────────────────────────────────── */

// Read is open to the whole workspace, exactly as reading the project is.
projectRouter.get(
  '/:projectId/members',
  apiLimiter,
  authGuard,
  loadProject,
  validate(listMembersQuerySchema, 'query'),
  asyncHandler(controller.listMembers)
);

projectRouter.post(
  '/:projectId/members',
  apiLimiter,
  authGuard,
  loadProject,
  requireProjectWrite,
  validate(addProjectMemberSchema),
  asyncHandler(controller.addMember)
);

projectRouter.patch(
  '/:projectId/members/:userId',
  apiLimiter,
  authGuard,
  loadProject,
  requireProjectWrite,
  validate(updateProjectMemberSchema),
  asyncHandler(controller.updateMemberRole)
);

projectRouter.delete(
  '/:projectId/members/:userId',
  apiLimiter,
  authGuard,
  loadProject,
  requireProjectWrite,
  asyncHandler(controller.removeMember)
);

// `requireProjectOwner`, not `requireProjectWrite`: a MANAGER may add and
// remove collaborators and may not hand the project to someone else.
projectRouter.patch(
  '/:projectId/transfer-ownership',
  apiLimiter,
  authGuard,
  loadProject,
  requireProjectOwner,
  validate(transferOwnershipSchema),
  asyncHandler(controller.transferOwnership)
);

export { workspaceRouter, projectRouter };
