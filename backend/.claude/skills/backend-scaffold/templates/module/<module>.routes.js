// Wires validators, guards and controller methods to endpoints. Every async
// controller goes through asyncHandler — an unwrapped rejection never
// reaches the error middleware.

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

// Middleware order is load-bearing: authGuard populates req.user, which
// loadMembership needs to resolve req.membership, which requirePermission
// reads. validate runs last so a caller who may not act here is rejected
// before their payload is parsed.

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
  // TODO: swap in the permission this module actually gates on.
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
