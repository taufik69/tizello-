// The single mount point for every route in the app. app.js mounts this
// router and nothing else, so adding a module means one import and one
// `router.use(...)` line here — never an edit to app.js.

import express from 'express';
import healthRoutes from './health.routes.js';

const router = express.Router();

// Health first, and outside the /api/v1 prefix: probes must not depend on
// versioned API routing, and keeping it ahead of everything else means no
// auth or rate-limit middleware added later can accidentally shadow it.
router.use('/health', healthRoutes);

// --- Feature module routes ---
// Each module owns one line. Keep them alphabetical.
// router.use('/api/v1/<module>s', <module>Routes);

export default router;
