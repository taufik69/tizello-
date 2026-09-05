import express from 'express';

const router = express.Router();

// Deliberately NOT wrapped in ApiResponse. Load balancers, container
// orchestrators and uptime monitors read this shape directly and are
// configured against these exact top-level keys — burying them under a
// `data` envelope would break every probe for the sake of consistency with
// endpoints that no probe reads.
//
// It also touches neither Postgres nor Redis on purpose: this answers "is
// the process up", which must stay true (and fast) even while a dependency
// is degraded. A dependency-checking readiness probe is a separate route.
router.get('/', (req, res) => {
  res.status(200).json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

export default router;
