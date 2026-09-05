/**
 * <module> routes — endpoint definitions and the middleware chain that
 * guards them. Declarative only: no logic lives here, and no handler is
 * defined inline.
 *
 * Two things this file is responsible for getting right:
 *
 *   1. EVERY async controller is wrapped in asyncHandler. An unwrapped one
 *      does not reach the global error handler — the request hangs instead.
 *   2. Middleware ORDER. authGuard populates req.user, which loadMembership
 *      needs to resolve req.membership, which requirePermission reads.
 *      validate runs last, so a caller who may not act here is rejected
 *      before their payload is parsed.
 *
 * Mount this router in src/routes/index.js — never in app.js.
 *
 * See .claude/skills/module-consistency/SKILL.md
 *      and docs/api/<module>.md
 */

import express from 'express';

import <module>Controller from './<module>.controller.js';
import { listQuerySchema, create<Module>Schema, update<Module>Schema } from './<module>.validator.js';
import validate from '../../shared/middlewares/validate.js';
import asyncHandler from '../../shared/utils/asyncHandler.js';
import { authGuard } from '../../shared/middlewares/auth.js';
import { loadMembership, requirePermission } from '../../shared/middlewares/permission.js';
import { apiLimiter } from '../../shared/middlewares/rateLimiter.js';
import { PERMISSIONS } from '../../shared/constants/roles.js';

const router = express.Router();

router.get(
  '/',
  authGuard,
  loadMembership,
  requirePermission(PERMISSIONS.WORKSPACE_VIEW),
  validate(listQuerySchema, 'query'),
  asyncHandler(<module>Controller.list)
);

router.get(
  '/:id',
  authGuard,
  loadMembership,
  requirePermission(PERMISSIONS.WORKSPACE_VIEW),
  asyncHandler(<module>Controller.getById)
);

router.post(
  '/',
  apiLimiter,
  authGuard,
  loadMembership,
  // TODO: swap in the permission this module actually gates on, and record
  // the choice in docs/api/<module>.md.
  requirePermission(PERMISSIONS.WORKSPACE_UPDATE),
  validate(create<Module>Schema),
  asyncHandler(<module>Controller.create)
);

router.patch(
  '/:id',
  apiLimiter,
  authGuard,
  loadMembership,
  requirePermission(PERMISSIONS.WORKSPACE_UPDATE),
  validate(update<Module>Schema),
  asyncHandler(<module>Controller.update)
);

router.delete(
  '/:id',
  apiLimiter,
  authGuard,
  loadMembership,
  requirePermission(PERMISSIONS.WORKSPACE_UPDATE),
  asyncHandler(<module>Controller.remove)
);

export default router;
