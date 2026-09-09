# Sprint 1 — Foundation: schema, slug utility, validator, dto

**Plan sections:** 1–3 · **Depends on:** nothing · **Blocks:** 2

## Goal

The database can hold a workspace with everything this module needs, a
name can become a unique slug, and request shapes are defined — no endpoint
ships this sprint.

## Tasks

### 1.1 Schema — `prisma/schema.prisma`

- [x] Done in migration `20260907062049_workspace_module`: `description`,
      `icon`, `color`, `plan`/`planExpiresAt`/`seatLimit`/`lastPaymentAt`
      (unused), `settings` (Json), `isArchived`, `deletedAt`,
      `projects Project[]` relation, `WorkspacePlan` enum, minimal `Project`
      stub model.
- [ ] Confirm `npx prisma validate` and `npx prisma generate` both clean
      before starting 1.2 (they were at schema-write time; re-check if this
      sprint starts later).

### 1.2 `src/shared/utils/slug.js`

- [ ] `generateSlug(name)` — lowercase, collapse any run of characters
      outside `[a-z0-9]` to a single `-`, trim leading/trailing `-`. Empty
      result → `"workspace"`.
- [ ] `withUniqueSlug(base, tryInsert)` (or equivalent) — calls `tryInsert`
      with `base`, then `base-2`, `base-3`, … on a Postgres `P2002` on the
      slug column, capped at 20 attempts, then throws. **Not** a
      `SELECT`-then-`INSERT` — see plan §2.1 for the race it avoids.
- [ ] Pure function, no Prisma import here — the retry loop takes an
      insert callback so this file stays testable without a database.
- [ ] Multi-line header pointing at `.claude/plan/workspace.md` §2.1.

### 1.3 `src/modules/workspace/workspace.validator.js`

- [ ] `createWorkspaceSchema`: `name` (2–80, trim, required), `description`
      (≤500, optional), `icon` (≤8 chars, optional), `color`
      (`/^#[0-9a-fA-F]{6}$/`, optional). No `slug` field — see plan §2.1.
- [ ] `updateWorkspaceSchema`: same four fields, all optional, plus
      `settings` (object, optional) — **reject an empty body** with
      `.min(1)` (Joi object-level), not a service-layer check.
- [ ] `archiveWorkspaceSchema`: `isArchived` (boolean, required).
- [ ] `listWorkspacesQuerySchema`: `page` (int ≥1, default 1), `limit`
      (int 1–100, default 20), `includeArchived` (boolean, default false).
- [ ] Every schema follows `auth.validator.js` conventions: `.trim()` on
      strings, coerced values, nothing here touches authorization.

### 1.4 `src/modules/workspace/workspace.dto.js`

- [ ] `toWorkspace(row, role)` — whitelist: `id, name, slug, description,
      icon, color, isArchived, role, createdAt, updatedAt`. **No billing
      field, ever** (plan §2.4). `role` is a parameter, not a column — the
      caller's membership role, stamped on per response.
- [ ] No Prisma import, no validation — pure shaping, matching
      `auth.dto.js` / `invitation.dto.js`.

## Definition of done

- [ ] `generateSlug("Product Team!!") === "product-team"`.
- [ ] `generateSlug("🚀🚀🚀") === "workspace"`.
- [ ] Two workspaces named `"Product Team"` in a row produce
      `product-team` and `product-team-2` (exercise via a throwaway script —
      no route exists yet to hit this through HTTP).
- [ ] Validator rejects an empty update body, accepts a create with only
      `name`.
- [ ] `toWorkspace` never emits `plan`/`planExpiresAt`/`seatLimit`/
      `lastPaymentAt` even when the row has them.

## Traps

- Do not reach for a `SELECT` to check slug availability before inserting —
  plan §2.1 explains why that race matters even at low traffic.
- Do not add a `Member` model or touch `Membership` — it already exists and
  already does this job.
- Do not let `settings` validation grow an opinion about its internal shape
  yet; that is a future sprint's problem, not this one's.
