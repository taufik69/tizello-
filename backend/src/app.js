import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";

import config from "./config/env.js";
import httpLogger from "./shared/middlewares/logger.middleware.js";
import passport from "./config/passport.js";
import routes from "./routes/index.js";
import {
  notFound,
  errorHandler,
} from "./shared/middlewares/error.middleware.js";

const app = express();

// Rate limiters key on req.ip, so what Express believes the client address is
// becomes a security property. Behind a proxy without this, EVERY request looks
// like it came from the proxy and one shared counter limits the whole world.
//
// Set to a hop count, never `true`. `true` makes Express trust the leftmost
// X-Forwarded-For entry, which the client itself supplies — so a caller can
// mint a fresh rate-limit budget per request by varying a header, and every
// limit in the app becomes advisory. The number is how many proxies actually
// sit in front of this process: 0 in local development, 1 behind a single
// load balancer.
app.set("trust proxy", Number(process.env.TRUST_PROXY_HOPS) || 0);

// --- Core middleware ---
app.use(helmet());
app.use(cors({ origin: config.clientOrigin, credentials: true }));
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

// Cookie parsing, mounted before the routes because the auth cookies ARE the
// credential: authGuard reads req.cookies.tizello_access and /refresh reads
// req.cookies.tizello_refresh. Mounted after this line, every guarded route
// would see req.cookies as undefined and fall back to the Bearer header — so
// the whole cookie session silently stops working while nothing errors.
//
// No secret is passed: these cookies are opaque or signed JWTs already, and a
// cookie-parser secret would only add a second, redundant signature layer.
app.use(cookieParser());

// passport.initialize() ONLY — never passport.session(). Passport sessions
// would install a second, competing notion of "who is signed in" beside our
// cookies and refresh-token rows, and only one of the two can be revoked.
app.use(passport.initialize());

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
