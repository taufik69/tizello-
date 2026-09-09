import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

import config from './config/env.js';
import httpLogger from './shared/middlewares/logger.middleware.js';
import routes from './routes/index.js';
import { notFound, errorHandler } from './shared/middlewares/error.middleware.js';

const app = express();

// --- Core middleware ---
app.use(helmet());
app.use(cors({ origin: config.clientOrigin, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging (pino-http, shared/middlewares/logger.middleware.js). It is
// mounted after the body parsers but before any route so that every handled
// request — including the 404 and error paths below — produces exactly one
// completion line, and it attaches `req.log`, the request-scoped child logger
// controllers and services should log through.
app.use(httpLogger);

// --- All routes (health is mounted first inside routes/index.js) ---
app.use(routes);

// --- 404 catch-all (after all routes) ---
app.use(notFound);

// --- Centralized error handler (must be mounted LAST) ---
app.use(errorHandler);

export default app;
