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

// --- Public static uploads ---
//
// Mounted at /static, per the operator's decision to serve uploaded files
// directly rather than through the authenticated GET /api/v1/uploads/:name.
//
// THIS MAKES EVERY UPLOADED FILE PUBLIC, and that is the trade being made
// rather than an oversight. `express.static` runs before any guard, so anyone
// holding a URL can read the file without a session — including files attached
// to a private project. The stored names are UUIDs, so they are unguessable,
// but unguessable is obscurity and not access control: a URL that leaks (a
// pasted link, a Referer header, a browser history sync) grants permanent
// access to that file and cannot be revoked short of deleting it.
//
// The authenticated route is still mounted and still works; this is a second,
// public way to read the same bytes. See docs/api/upload.md §Two read paths.
//
// What still holds:
//
// - Only files this server WROTE are here, and `shared/middlewares/upload.js`
//   names them `<uuid>.<ext>` from a MIME allowlist. So there is no stored
//   HTML or SVG to be served as script, and no client-supplied path component
//   for `express.static` to resolve outside the directory.
// - `Cross-Origin-Resource-Policy: cross-origin` is required, not optional:
//   helmet() above defaults it to `same-origin`, which would make the browser
//   drop every one of these responses when the web client on another origin
//   loads them in an <img> or an <object>.
// - NO `Content-Security-Policy: sandbox` here, and that is a correction
//   rather than an omission. It was set at first as cheap insurance, and it
//   cost something real: a sandboxed document cannot start the browser's own
//   PDF viewer, so opening an attachment in a tab downloaded it instead of
//   showing it. The case the header was hedging against — a stored file the
//   browser treats as a document — is already closed by the MIME allowlist
//   (no HTML, no SVG) and by `nosniff` (a .txt cannot be re-read as HTML).
// - `index: false` and `dotfiles: 'deny'`, so the mount cannot list the
//   directory or hand back a stray dotfile.
// - The names are content-addressed and never reused, which is what makes
//   `immutable` and a one-year max-age correct rather than aggressive.
//
// Mounted after httpLogger so a file request produces the same single
// completion line every other request does, and before `routes` so it is
// reached before the 404 catch-all. A miss falls through to that catch-all and
// gets the app's own JSON 404 rather than the static handler's HTML.
app.use(
  "/static",
  express.static(config.upload.dir, {
    index: false,
    dotfiles: "deny",
    maxAge: "365d",
    immutable: true,
    setHeaders: (res) => {
      res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
      res.setHeader("X-Content-Type-Options", "nosniff");
    },
  })
);

// --- All routes (health is mounted first inside routes/index.js) ---
app.use(routes);

// --- 404 catch-all (after all routes) ---
app.use(notFound);

// --- Centralized error handler (must be mounted LAST) ---
app.use(errorHandler);

export default app;
