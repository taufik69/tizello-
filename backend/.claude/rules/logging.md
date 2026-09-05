# Logging

One logger for the whole backend, configured once in
[`src/config/logger.js`](../../src/config/logger.js) (pino) and mounted for
HTTP in
[`src/shared/middlewares/logger.middleware.js`](../../src/shared/middlewares/logger.middleware.js)
(pino-http).

See [.claude/skills/backend-scaffold/SKILL.md](../skills/backend-scaffold/SKILL.md)
for where these files sit, and [error-handling.md](./error-handling.md) for the
error path whose one logging point is the global handler.

## Rules

- **Never call `console.*`.** Console output is unstructured, unleveled and
  cannot be filtered, silenced or shipped to a collector. The single exception
  is the missing-env check in `config/env.js`: the logger is built *from*
  config, so it does not exist yet at that point.
- **One child logger per subsystem**, created at module scope:

  ```js
  import { createLogger } from '../config/logger.js';
  const log = createLogger('db');   // server | db | redis | http | email-worker
  ```

  The tag renders as the `[db]` prefix in development and stays a queryable
  field in production JSON.
- **Inside a request, log through `req.log`**, not the module logger. The
  request logger carries the request id, which is the only thing tying a line
  to the request that produced it. `(req.log ?? log)` where the code may run
  before the middleware.
- **Errors go in the merge object, never the message:**

  ```js
  log.error({ err: error }, 'Postgres connection failed');   // yes
  log.error(`failed: ${error.message}`);                     // no — loses type and stack
  ```

  `pino.stdSerializers.err` unpacks type, message and stack; an Error's own
  properties are non-enumerable, so an Error logged any other way serializes
  to `{}`.
- **Levels carry meaning.** `fatal` — the process is about to exit. `error` —
  an unexpected failure a human should look at. `warn` — a handled anomaly, and
  the level for 4xx. `info` — lifecycle and completed requests. `debug` —
  detail useful only while working on it (SQL, health probes); default in
  development, off elsewhere.
- **`await flushLogger()` before `process.exit()`.** In development pino writes
  through a worker thread and `process.exit()` does not wait for it, so the
  line explaining the exit is exactly the one that gets dropped.
- **Never log a secret.** The root logger redacts `authorization` and `cookie`
  headers, `password`, `passwordHash` and `token`; that list is a safety net,
  not permission to pass credentials through it.

## What is logged for you

`shared/middlewares/logger.middleware.js` already emits one line per request
(method, URL, status, duration, request id) and the global error handler
already logs unexpected errors with their stack. Do not log "entering handler"
or re-log an error you are re-throwing — a request that logs itself three
times is harder to read, not easier.
