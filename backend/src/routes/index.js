// The single mount point for every route in the app. app.js mounts this
// router and nothing else, so adding a module means one import and one
// `router.use(...)` line here — never an edit to app.js.

import express from 'express';
import healthRoutes from './health.routes.js';
import authRoutes from "../modules/auth/auth.routes.js";
import {
  workspaceRouter as invitationWorkspaceRoutes,
  tokenRouter as invitationTokenRoutes,
} from "../modules/invitation/invitation.routes.js";
import {
  workspaceRouter as projectWorkspaceRoutes,
  projectRouter as projectRoutes,
} from "../modules/project/project.routes.js";
import workspaceRoutes from "../modules/workspace/workspace.routes.js";

const router = express.Router();

// Health first, and outside the /api/v1 prefix: probes must not depend on
// versioned API routing, and keeping it ahead of everything else means no
// auth or rate-limit middleware added later can accidentally shadow it.
router.use('/health', healthRoutes);

// --- Feature module routes ---
// Each module owns one line. Keep them alphabetical.
router.use("/api/v1/auth", authRoutes);
// Two mounts, one module: admin routes are workspace-scoped because the
// permission middleware resolves a membership from (userId, workspaceId), and
// recipient routes are token-scoped because the recipient has no membership yet.
router.use("/api/v1/invitations", invitationTokenRoutes);
// Two mounts, one module, for the same reason invitations need two: create and
// list are workspace-scoped because the permission middleware resolves a
// membership from (userId, workspaceId); everything else is addressed by the
// project's own globally unique id.
router.use("/api/v1/projects", projectRoutes);
router.use("/api/v1/workspaces/:workspaceId/invitations", invitationWorkspaceRoutes);
router.use("/api/v1/workspaces/:workspaceId/projects", projectWorkspaceRoutes);
router.use("/api/v1/workspaces", workspaceRoutes);

export default router;
