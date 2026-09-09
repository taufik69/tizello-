/**
 * Property-definition endpoints, mounted at
 * `/api/v1/workspaces/:workspaceId/properties`.
 *
 * Workspace-scoped, not project-scoped, because that is what a definition
 * belongs to: adding one adds the column to every project in the workspace
 * (plan §2.1).
 *
 * **Editing the schema is admin-only; editing a value is not.** Adding a column
 * changes the shape of every project in the workspace, where filling one in
 * changes one project — so writes here take `PROJECT_MANAGE_ANY` (OWNER and
 * ADMIN) while a value rides `PATCH /projects/:id` behind the unchanged
 * `requireProjectWrite`. A plain MEMBER may therefore create a project and set
 * its properties, and may not invent a new one for everybody.
 *
 * See docs/api/project-property.md
 */

import express from 'express';

import controller from './project-property.controller.js';
import {
  createPropertySchema,
  updatePropertySchema,
} from './project-property.validator.js';
import validate from '../../shared/middlewares/validate.js';
import asyncHandler from '../../shared/utils/asyncHandler.js';
import { authGuard } from '../../shared/middlewares/auth.js';
import { loadMembership, requirePermission } from '../../shared/middlewares/permission.js';
import { PERMISSIONS } from '../../shared/constants/roles.js';

// `mergeParams` is load-bearing: without it `req.params.workspaceId` is
// undefined inside this router, so `loadMembership` cannot resolve a membership
// and every request 400s on a workspace id that is right there in the URL.
const router = express.Router({ mergeParams: true });

router.get(
  '/',
  authGuard,
  loadMembership,
  requirePermission(PERMISSIONS.PROJECT_VIEW),
  asyncHandler(controller.list)
);

router.post(
  '/',
  authGuard,
  loadMembership,
  requirePermission(PERMISSIONS.PROJECT_MANAGE_ANY),
  validate(createPropertySchema),
  asyncHandler(controller.create)
);

router.patch(
  '/:propertyId',
  authGuard,
  loadMembership,
  requirePermission(PERMISSIONS.PROJECT_MANAGE_ANY),
  validate(updatePropertySchema),
  asyncHandler(controller.update)
);

router.delete(
  '/:propertyId',
  authGuard,
  loadMembership,
  requirePermission(PERMISSIONS.PROJECT_MANAGE_ANY),
  asyncHandler(controller.remove)
);

export default router;
