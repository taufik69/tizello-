# Plan — Workspace module

## 1. What already exists

- `Workspace` model — extended in migration `20260907062049_workspace_module`
  with `description`, `icon`, `color`, billing columns (`plan`,
  `planExpiresAt`, `seatLimit`, `lastPaymentAt` — schema only, no logic),
  `settings` (Json), `isArchived`, `deletedAt`, and a `projects` relation.
- `Membership` model — **already** User↔Workspace with `Role` enum
  (OWNER/ADMIN/MEMBER), already read by `shared/middlewares/permission.js`
  (`loadMembership`, `requirePermission`, `requireRole`). This module does
  **not** add a `Member` model — one exists under this name already.
- `shared/constants/roles.js` — `WORKSPACE_VIEW/UPDATE/DELETE` permissions
  already defined and granted per role. Nothing to add here.
- `Project` model — added as a minimal stub (`id`, `workspaceId`, `name`,
  timestamps) so `Workspace.projects` compiles. Not a real module yet.
- `docs/api/workspace.md` — contract written. This plan should not disagree
  with it; if it ever does, the doc wins and this file gets corrected.

## 2. Design decisions

### 2.1 Slug — server-generated, immutable

`slugify(name)` (lowercase, non-`[a-z0-9]` runs → single `-`, trimmed;
empty → `"workspace"`), collision resolved by catching Postgres `P2002` on
insert and retrying with `-2`, `-3`, … up to 20 attempts. Never a pre-check
`SELECT` — that has a TOCTOU race between two requests picking the same base
name. Never accepted from the client, never editable after create.

### 2.2 Archive vs soft-delete — two independent columns

`isArchived` (reversible, hides from default list) and `deletedAt`
(permanent, excluded from every read) are not the same operation and not
folded into one status enum. See `docs/api/workspace.md` §*Workspace model*
for the full reasoning.

### 2.3 Ownership is a `Membership` row, not a column

No `ownerId` on `Workspace`. `createWorkspace` inserts the workspace and an
`OWNER` membership in one transaction — a workspace with no OWNER membership
is an invariant violation, never a valid state.

### 2.4 Billing is schema-only

`plan`/`planExpiresAt`/`seatLimit`/`lastPaymentAt` exist so the SSLCommerz
work later doesn't need a migration, but no service, DTO, or endpoint in this
plan touches them. Flagged as a contract divergence in the doc precisely so
it isn't "fixed" by someone wiring it in without a billing design pass.

## 3. Endpoint contract

Full detail in `docs/api/workspace.md`. Summary:

| # | Method | Path | Guard | Limiter | Role |
|---|---|---|---|---|---|
| 1 | POST | `/workspaces` | `authGuard` | `workspaceCreateLimiter` 10/hr | any authed user |
| 2 | GET | `/workspaces` | `authGuard` | `apiLimiter` | any (scoped to own memberships) |
| 3 | GET | `/workspaces/:id` | `authGuard` + `loadMembership` | `apiLimiter` | any member |
| 4 | PATCH | `/workspaces/:id` | + `requirePermission(WORKSPACE_UPDATE)` | `apiLimiter` | OWNER/ADMIN |
| 5 | PATCH | `/workspaces/:id/archive` | + `requirePermission(WORKSPACE_UPDATE)` | `apiLimiter` | OWNER/ADMIN |
| 6 | DELETE | `/workspaces/:id` | + `requirePermission(WORKSPACE_DELETE)` | `apiLimiter` | OWNER only |

## 4. Rate limiting

One new limiter: `workspaceCreateLimiter` (1h / 10) in
`shared/middlewares/rateLimiter.js`, same `failClosed` wrapper as every
existing limiter. Everything else rides the existing `apiLimiter`.

## 5. Failure modes

| Condition | Behaviour | Why |
|---|---|---|
| Redis unreachable | `429`, fail closed | Matches every existing limiter — see `auth.md` §*Rate limiting*. |
| Slug collision loop exhausted (20 attempts) | `500` | Unreachable in practice; a real cap beats an infinite loop. |
| Non-member calls get/update/archive/delete | `404`, not `403` | `loadMembership`'s existing behavior — confirming existence to a non-member is the leak. |

## 6. Files to create

```
src/shared/utils/slug.js                     (new)
src/modules/workspace/workspace.routes.js     (new)
src/modules/workspace/workspace.controller.js (new)
src/modules/workspace/workspace.service.js    (new)
src/modules/workspace/workspace.repository.js (new)
src/modules/workspace/workspace.dto.js        (new)
src/modules/workspace/workspace.validator.js  (new)
src/shared/middlewares/rateLimiter.js         (edit — add workspaceCreateLimiter)
src/routes/index.js                           (edit — mount workspace routes)
```

## 7. Build order

See `.claude/specs/workspace/README.md` for the sprint breakdown. Order:
schema (done) → slug util + validator → repository + dto → service →
controller + routes + limiter + mount → verify against `docs/api/workspace.md`.

## 8. Open questions — not blocking, tracked in the contract doc

Hard-delete/purge policy, seat-limit enforcement, ownership transfer. See
`docs/api/workspace.md` §*Open questions*. None of the three block sprints
1–3 below.

## 9. Built — two shared-infra bugs found, not architectural

All three sprints shipped as planned; nothing in §§1–7 changed shape during
implementation. Full detail in
`.claude/specs/workspace/README.md` §*Status*:

1. Prisma Client needed a manual `generate` after the schema migration —
   the running dev server had a pre-migration client cached.
2. `shared/middlewares/validate.js`'s `target: 'query'` was dead code until
   `GET /workspaces` used it, and broke on Express 5's getter-only
   `req.query`. Fixed in that shared file, not worked around in this module.
