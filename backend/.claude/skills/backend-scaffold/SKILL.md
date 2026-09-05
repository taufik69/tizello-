---
name: backend-scaffold
description: MUST BE USED whenever backend structure is being created in this repo — "scaffold a backend", "set up the backend structure", "new backend boilerplate", "initialize the API", "add a new module/feature/resource", "create the <x> endpoints". Scaffolds the house modular Node.js + Express + PostgreSQL + Prisma layout (config/modules/queues/workers/shared/routes) with a working health route, Prisma singleton, Redis, BullMQ email queue + worker, central error handling, and OWNER/ADMIN/MEMBER permission middleware. ALWAYS use this instead of inventing a folder layout, a response shape, or a module file split by hand.
---

# Backend scaffold

Scaffolds a backend that matches our `electrogadet_v2` conventions, adapted to
Postgres + Prisma. Two jobs, and only these two:

1. **Full scaffold** — the whole `backend/` tree, once, at the start of a project.
2. **New module** — six files for one feature, any time after that.

Ready-to-copy files live in `templates/`. Copy them; do not retype them from
memory, and do not improve them in passing — drift between modules is the thing
this skill exists to prevent.

## The rule that matters most

**Scaffolding produces working infrastructure and stubbed features.**

Health, Prisma, Redis, the queue, the worker, error handling, auth and
permissions all run for real the moment they are copied. Feature business logic
does **not**: services and DTOs land with `TODO` comments marking the decisions
that need a human. Do not implement a module's rules while scaffolding it —
wait to be asked. Scaffold, report what is stubbed, stop.

---

## Job 1 — full scaffold

Run only when `backend/src/` does not already exist. If it does, this is a
new-module request (Job 2) — never overwrite a live tree.

### 1. Layout

```
backend/
  prisma/
    schema.prisma
    migrations/            # created by `prisma migrate dev`
  src/
    config/                db.js (Prisma singleton), env.js, logger.js, redis.js
    modules/               one folder per feature, 6 files each (Job 2)
    queues/                BullMQ producers — email.queue.js
    workers/               BullMQ consumers — email.worker.js, run-email-worker.js
    shared/
      middlewares/         auth.js, permission.js, error.middleware.js, logger.middleware.js, validate.js, rateLimiter.js
      utils/               apiResponse.js, AppError.js, asyncHandler.js
      constants/           roles.js, httpStatus.js
    routes/                index.js — mounts health first, then every module
    app.js
  index.js
  prisma.config.js         # Prisma 7 CLI config — holds DATABASE_URL for migrate
  .env.example
  .gitignore
  .nvmrc
  package.json
```

### 2. Copy the templates

`templates/root/` → `backend/`, `templates/src/` → `backend/src/`,
`templates/prisma/` → `backend/prisma/`. `templates/module/` is for Job 2 and is
never copied wholesale.

Leave `src/modules/` empty (add a `.gitkeep`) — modules arrive one at a time.

### 3. Install and generate

```bash
npm install
npx prisma generate
npx prisma migrate dev --name init   # needs a reachable DATABASE_URL
```

`prisma migrate dev` is the one step that needs a live database. If Postgres is
not up — or reachable but without usable credentials — stop after `generate`,
say so plainly, and leave the migration to the user. Do not start a container,
create roles or databases, or edit their database settings to get past it.

**Prisma 7 note.** `url` is no longer allowed in the `datasource` block. The
connection string lives in two places instead, and both are already wired:
`prisma.config.js` for the CLI (`migrate`, `studio`), and the `@prisma/adapter-pg`
driver adapter in `src/config/db.js` for the running app. On Prisma 6 or
earlier, `url = env("DATABASE_URL")` in the schema replaces both.

### 4. Verify

```bash
cp .env.example .env    # then fill in real values
npm run dev
curl -s localhost:5000/health
```

Expected, exactly:

```json
{ "status": "ok", "uptime": 12.34, "timestamp": "2026-09-05T10:00:00.000Z" }
```

Then report: what was created, that `/health` answered, and which pieces are
stubs (the email transport, `src/modules/`).

---

## Job 2 — new module

Six files, always all six, in `src/modules/<module>/`:

| File | Owns | Never |
|---|---|---|
| `<module>.controller.js` | read `req`, call the service, send via `ApiResponse` | business rules, Prisma |
| `<module>.service.js` | business rules, orchestration, `AppError` | `req`/`res`, Prisma |
| `<module>.repository.js` | every Prisma call in the module | business rules, HTTP concepts |
| `<module>.routes.js` | endpoints, middleware order | logic of any kind |
| `<module>.dto.js` | request → payload, row → response | validation, DB access |
| `<module>.validator.js` | Joi schemas — request *shape* | authorization, business rules |

A layer may only call the one below it: controller → service → repository. A
controller that imports `prisma`, or a service that touches `res`, is the
mistake this split exists to prevent.

### Steps

1. Copy all six files from `templates/module/` into `src/modules/<module>/`.
2. Rename each file, replacing `<module>` with the singular camelCase name
   (`task`, `sprint`, `workspaceMember`).
3. Replace the placeholders **inside** the files:
   - `<module>` → singular camelCase (`task`) — variables, imports, `prisma.task`
   - `<Module>` → PascalCase (`Task`) — schema names, response messages
4. Add the Prisma model to `prisma/schema.prisma`, then
   `npx prisma migrate dev --name add_<module>`.
5. Mount it in `src/routes/index.js` — one import, one `router.use()`, kept
   alphabetical. **Never edit `app.js` to add a route.**
6. Leave every `TODO` in place unless the request also asked for the logic.

Both replacements at once, from the module directory:

```bash
cd backend/src/modules/task
for f in '<module>'.*.js; do mv "$f" "${f/<module>/task}"; done
sed -i 's/<module>/task/g; s/<Module>/Task/g' ./*.js
```

---

## Conventions these templates encode

Follow them in anything added later, too.

- **ESM everywhere.** `"type": "module"`, `import`, and `.js` extensions in
  every relative import — Node's ESM resolver requires them.
- **`config/env.js` is the only file that reads `process.env`.** Everything
  else imports `config`. Missing required vars exit at boot rather than
  surfacing as a 500 later.
- **One Prisma client, from `config/db.js`.** Never `new PrismaClient()`
  anywhere else — each instance carries its own connection pool.
- **Two Redis clients, both from `config/redis.js`.** `redisClient` for app
  use, `connection` for BullMQ (which needs `maxRetriesPerRequest: null`).
  They cannot be the same client.
- **Every response goes through `ApiResponse`** — `{ success, statusCode,
  message, data }`. The one deliberate exception is `/health`, which returns
  its raw shape because uptime probes are configured against those exact keys.
- **Errors are thrown, never responded to.** Services throw `AppError`;
  `shared/middlewares/error.middleware.js` is the only place an error becomes a response.
  It also maps Prisma's `P2002`/`P2025`/`P2003` onto 409/404/400.
- **Every async controller is wrapped in `asyncHandler`.**
- **Authorization comes out of `shared/constants/roles.js`.** Use
  `requirePermission(PERMISSIONS.X)`; reach for `requireRole` only when the
  check is genuinely about identity, not capability. No route hard-codes a role
  string.
- **Slow work goes on a queue.** Anything a client should not wait for — email
  above all — is enqueued in the service and handled by a worker, which runs as
  its own process (`npm run worker:email`), not inside the API.
- **Log through `config/logger.js`, never `console.*`.** One pino root logger;
  each subsystem takes `createLogger('<tag>')` — `server`, `db`, `redis`,
  `http`, `email-worker` — which is what renders the `[tag]` prefix and makes
  a line greppable. Inside a request, log through `req.log` (attached by
  `shared/middlewares/logger.middleware.js`) so the line carries the request
  id. Pass an error as the merge object, `log.error({ err }, 'message')`, not
  concatenated into the string. The single allowed exception is the missing-env
  check in `config/env.js`, which runs before a logger can exist.

## What this skill does not do

Auth token *issuing*, the email transport, and feature logic are all out of
scope. The scaffold leaves clearly marked seams for them. Ask before filling
one in.
