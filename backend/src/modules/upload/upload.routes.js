/**
 * Upload endpoints, mounted at `/api/v1/uploads`.
 *
 * NOT workspace-scoped, deliberately. A file is uploaded BEFORE it is attached
 * to anything — the user picks it in a drawer that may never be saved — so
 * there is no project to scope it to yet, and scoping it to a workspace would
 * be a permission check on a resource the request has not named. `authGuard`
 * is the real boundary: an upload costs disk, so it takes an account.
 *
 * The read side is the same shape: any authenticated user may fetch any stored
 * file by its generated name. That is a deliberate, documented limit — the
 * name is a UUID, so it is unguessable, but it is not an authorization check.
 * Per-file ownership needs a files TABLE rather than metadata in a project's
 * Json, and that is the open question in docs/api/upload.md.
 *
 * See docs/api/upload.md
 */

import express from 'express';

import controller from './upload.controller.js';
import asyncHandler from '../../shared/utils/asyncHandler.js';
import { authGuard } from '../../shared/middlewares/auth.js';
import { singleFile } from '../../shared/middlewares/upload.js';
import { apiLimiter, uploadLimiter } from '../../shared/middlewares/rateLimiter.js';

const router = express.Router();

// Limiter BEFORE multer: a rejected request must not have written a file
// first, which is the whole point of rate-limiting an upload endpoint.
router.post('/', uploadLimiter, authGuard, singleFile, asyncHandler(controller.create));

router.get('/:name', apiLimiter, authGuard, asyncHandler(controller.download));

export default router;
