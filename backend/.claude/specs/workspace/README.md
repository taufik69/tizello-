# Workspace — sprint breakdown

Three sprints implementing [`.claude/plan/workspace.md`](../../plan/workspace.md).
The plan holds the **reasoning**; these files hold the **work**. When they
disagree, the plan wins — and gets updated to say why.

| Sprint | Delivers | Blocks |
|---|---|---|
| [1](./workspace.sprint1.md) | Schema (done), slug util, validator, dto | 2 |
| [2](./workspace.sprint2.md) | Repository + service + create/list/get, mounted | 3 |
| [3](./workspace.sprint3.md) | Update/archive/delete, rate limiter, full verification | — |

## Rules that apply to every sprint

Non-negotiable, from the repo's own docs. A sprint is not done if it breaks one.

- **Six files per module** — controller, service, repository, routes, dto,
  validator. [module-consistency](../../skills/module-consistency/SKILL.md)
- **Controllers never call `res.json()`.** Everything goes through
  `ApiResponse`. [api-response](../../skills/api-response/SKILL.md)
- **Services throw `AppError`, never touch `res`.** Every async controller is
  wrapped in `asyncHandler`. [error-handling](../../rules/error-handling.md)
- **No `console.*`.** `createLogger('<tag>')` at module scope, `req.log` inside
  a request. [logging](../../rules/logging.md)
- **Multi-line comment header on every file**, recording the *why*.
  [code-comments](../../rules/code-comments.md)
- **No new `Member` model.** `Membership` already exists — reuse it.
- **No billing logic.** The billing columns on `Workspace` are schema-only —
  no sprint below touches them.
- **The contract doc (`docs/api/workspace.md`) is already written.** Editing
  a status code, guard, limiter, or validation rule mid-sprint means editing
  the doc in the same commit, not after.

## Order

Sequential: 1 → 2 → 3. Small module, no parallel track.

## Status — all three sprints are built

Every endpoint in `docs/api/workspace.md` exists and its Definition of Done
was verified against a running server and the live database: create,
slug-collision retry, list with `includeArchived`, get (member/non-member/
nonexistent all `404` alike), update (OWNER/ADMIN yes, MEMBER `403`), archive
+ unarchive, delete (OWNER yes, ADMIN `403`, repeat delete `404` not `200`).

Two bugs surfaced during verification, both in shared infrastructure this
module was the first to exercise, not in the module itself:

1. **Prisma Client was stale after the schema edit.** `npx prisma migrate dev`
   is expected to regenerate it, but the running dev server had a client
   generated before the migration; `npx prisma generate` fixed it. Watch for
   this after any schema change made mid-session rather than at a clean
   restart.
2. **`shared/middlewares/validate.js`'s `target: 'query'` was broken on
   Express 5.** `req.query` is a getter-only property on the prototype in
   Express 5 (no setter, unlike Express 4) — `req[target] = value` threw
   `Cannot set property query of #<IncomingMessage> which has only a
   getter`. No existing module had ever called `validate(schema, 'query')`
   before `GET /workspaces`, so this was latent rather than newly introduced.
   Fixed with `Object.defineProperty(req, 'query', { value, writable: true,
   configurable: true })` to shadow the prototype getter; `body` and
   `params` were unaffected and still use plain assignment.
