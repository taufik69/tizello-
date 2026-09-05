# Error handling

The single error path for the whole backend. Every module follows it; there
are no per-module exceptions.

See [.claude/skills/module-consistency/SKILL.md](../skills/module-consistency/SKILL.md)
for the module layout this sits inside, and
[.claude/skills/api-response/SKILL.md](../skills/api-response/SKILL.md) for the
response envelope.

## The flow

```
route
  → asyncHandler(controller)
      → controller calls service
          → service throws AppError on failure
      → asyncHandler catches the rejection, calls next(err)
  → global error handler (mounted LAST)
      → ApiResponse.error(res, statusCode, message)
```

## Rules

- **`asyncHandler` wraps every async controller** (`shared/utils/asyncHandler.js`),
  wired at the routes layer. **No `try/catch` in controllers.** An unwrapped
  async controller that throws produces an unhandled rejection and a hung
  request — the error never reaches the handler, so nothing is logged and
  nothing is returned.
- **Services throw `AppError(statusCode, message)`** (`shared/utils/AppError.js`)
  and never send responses. A service has no `res` and must not be given one:
  the moment it can respond, it can no longer be called from a worker or
  another service.
- **Never throw a generic `Error` for an expected failure.** It is treated as
  a bug and becomes a 500 — right for a bug, wrong for "that task doesn't
  exist".
- **Status codes come from `shared/constants/httpStatus.js`**, never bare
  integers.

## The global handler

`shared/middlewares/error.middleware.js`

- Signature is **`(err, req, res, next)`** — four arguments. Express
  identifies an error handler by that arity; drop the unused `next` and it
  silently becomes ordinary middleware that never runs.
- **Mounted LAST in `app.js`**, after every route and every other middleware
  (and after the 404 catch-all).
- It is the **only** place in the app that turns an error into a response.

### Known vs unknown

| Error | Response |
|---|---|
| `instanceof AppError` (operational) | `ApiResponse.error(res, err.statusCode, err.message)` — we chose both, so both are safe to send |
| anything else | log the real error server-side; respond generic `500 "Internal server error"` |

**Never leak internal details to the client** — Prisma/driver messages, SQL,
constraint names, file paths or stack traces disclose schema and library
versions. Stack traces appear in development only, and only as an extra field.

Prisma's own codes are mapped to operational errors before this split, so a
duplicate key is a `409` rather than a 500 carrying the constraint name:
`P2002` → 409, `P2025` → 404, `P2003` → 400.
