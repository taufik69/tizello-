# Sprint 1 — Foundation: schema, permissions, key utility, validator, dto

**Plan sections:** 1–4 · **Depends on:** nothing · **Blocks:** 2

## Goal

The database can hold a real project and its members, the permission table
knows what a project is, a name can become a unique per-workspace key, and
request/response shapes are defined. **No endpoint ships this sprint.**

## Tasks

### 1.1 Schema — `prisma/schema.prisma`

- [x] Add enums `ProjectStatus` (PLANNING, ACTIVE, ON_HOLD, BACKLOG,
      COMPLETED, CANCELLED — **no `ARCHIVED`**, plan §2.1 correction 1),
      `Priority` (LOW, MEDIUM, HIGH, URGENT), `ProjectRole` (OWNER, MANAGER,
      COLLABORATOR).
- [x] **Replace** the `Project` stub with the full model in plan §3. Keep
      `@@map("projects")` — the table already exists, this is an ALTER not a
      CREATE.
- [x] Add `ProjectMember` with `@@unique([projectId, userId])`,
      `@@index([projectId])`, `@@map("project_members")`.
- [x] Indexes on `Project`: `@@unique([workspaceId, key])`,
      `@@index([workspaceId])`, `@@index([ownerId])`,
      `@@index([workspaceId, status])`.
- [x] `onDelete`: `Cascade` on `Project.workspace` and both `ProjectMember`
      relations; **`Restrict`** on `Project.owner` (plan §2.1 correction 3).
- [x] Add `taskCounter Int @default(0)` with a comment saying nothing reads or
      writes it yet and pointing at plan §2.3 — mirror the wording style of
      the billing-column comment on `Workspace`.
- [x] `User` gains `ownedProjects Project[] @relation("ProjectOwner")` and
      `projectMemberships ProjectMember[]`.
- [x] Comment above `ProjectRole`: *"OWNER here mirrors `Project.ownerId`,
      which is the authoritative read — see plan §2.4."*
- [x] Migration: `npx prisma migrate dev --name project_module`.
      **Existing `projects` rows have no `key` / `ownerId`** — if the table is
      non-empty the migration needs a backfill step before the NOT NULL
      constraints. Check first; the stub was never written to, so it is
      probably empty and this is a no-op.
- [x] `npx prisma validate` clean, then **`npx prisma generate` explicitly** —
      workspace sprint 3 lost time to a stale client after a mid-session
      migration (`specs/workspace/README.md` §Status bug 1).

### 1.2 Permissions — `src/shared/constants/roles.js`

- [x] Add to `PERMISSIONS`: `PROJECT_VIEW: 'project:view'`,
      `PROJECT_CREATE: 'project:create'`,
      `PROJECT_MANAGE_ANY: 'project:manage:any'`.
- [x] Grant per plan §4: all three to OWNER and ADMIN; `PROJECT_VIEW` +
      `PROJECT_CREATE` to MEMBER.
- [x] Do **not** add project roles to `ROLES` or `ROLE_ORDER` — that file is
      workspace roles only. `ProjectRole` is module data, not a workspace
      ladder.
- [x] One comment line on `PROJECT_CREATE` recording that granting it to
      MEMBER is a deliberate default and a one-line change to reverse.

### 1.3 `src/shared/utils/projectKey.js`

- [x] `deriveKey(name)` — uppercase, drop non-alphanumerics, initials of each
      word; single word → first 3 chars; clamp to 2–5 chars; empty → `"PROJ"`.
- [x] `withUniqueKey(base, tryInsert)` — call `tryInsert(base)`, then
      `base2`, `base3`, … on P2002, capped at 20, then throw. Read
      `shared/utils/slug.js` first and mirror its structure and P2002
      detection; do not invent a second style.
- [x] Suffix must keep the result ≤5 chars — trim the base, not the suffix
      (`ABCDE` + 2 → `ABCD2`, never `ABCDE2`).
- [x] Pure: no Prisma import. The insert callback is what touches the database.
- [x] Multi-line header pointing at plan §2.2, including *why* a client key
      collides loudly (409) while a derived one suffixes silently.

### 1.4 `src/modules/project/project.validator.js`

- [x] `createProjectSchema`: `name` (2–100, trim, required), `key`
      (`/^[A-Z][A-Z0-9]{1,4}$/`, optional — derived when absent),
      `description` (≤2000, optional), `status` (ProjectStatus value,
      default `PLANNING`), `priority` (Priority value, default `MEDIUM`),
      `icon` (≤8, optional), `color` (`/^#[0-9a-fA-F]{6}$/`, optional),
      `startDate` / `endDate` (ISO date, optional).
- [x] **`endDate` must be `>= startDate`** — Joi `.min(Joi.ref('startDate'))`,
      in the validator, not the service (plan §8).
- [x] `updateProjectSchema`: same fields **except `key`** (immutable, plan
      §2.2), all optional, `.min(1)` to reject an empty body — same rule as
      `workspace.validator.js`.
- [x] `archiveProjectSchema`: `isArchived` (boolean, required).
- [x] `listProjectsQuerySchema`: `page` (int ≥1, default 1), `limit` (int
      1–100, default 20), `status`, `priority`, `includeArchived` (bool,
      default false), `q` (≤100, trim, optional), `mine` (bool, default false).
- [x] `addProjectMemberSchema` / `updateProjectMemberSchema`: `userId`
      (required on add), `role` — **`MANAGER` or `COLLABORATOR` only, never
      `OWNER`** (ownership moves through the transfer endpoint alone, plan §8).
- [x] `transferOwnershipSchema`: `userId` (required).
- [x] Follow `workspace.validator.js` conventions: `.trim()`, coerced values,
      nothing here makes an authorization decision.

### 1.5 `src/modules/project/project.dto.js`

- [x] `toProject(row, viewerRole)` — whitelist: `id, name, key, description,
      status, priority, icon, color, startDate, endDate, isArchived,
      workspaceId, ownerId, viewerRole, createdAt, updatedAt`.
- [x] **Never emits `taskCounter` or `deletedAt`.**
- [x] `toProjectMember(row)` — `id, userId, role, createdAt`, plus a nested
      `user` (`id`, `name`, `email`) when the row was loaded with it. No
      `passwordHash`, no `emailVerifiedAt` — whitelist, never blacklist.
- [x] `viewerRole` is a parameter, not a column — the caller's effective
      project role, computed by `loadProject` in sprint 2. Same technique as
      `workspace.dto.js`'s `role`.
- [x] No Prisma import, no validation — pure shaping.

## Definition of done

- [x] `npx prisma migrate dev` applies clean; `npx prisma generate` run
      explicitly after it.
- [x] `deriveKey("Tizello Web App") === "TWA"`;
      `deriveKey("Tizello") === "TIZ"`; `deriveKey("🚀") === "PROJ"`.
- [x] `withUniqueKey` produces `TIZ`, then `TIZ2`, then `TIZ3` against a stub
      `tryInsert` that throws P2002 for keys already taken (throwaway script —
      no route exists yet).
- [x] `hasPermission('MEMBER', 'project:manage:any') === false`;
      `hasPermission('ADMIN', 'project:manage:any') === true`.
- [x] Validator rejects an empty update body, rejects `key` in an update,
      rejects `endDate` before `startDate`, rejects `role: 'OWNER'` on a
      member add, accepts a create with only `name`.
- [x] `toProject` never emits `taskCounter` even when the row carries it.

## Traps

- Do not keep `ARCHIVED` in `ProjectStatus` because the draft schema had it —
  plan §2.1 correction 1 is the whole reason this sprint exists before code.
- Do not add `Sprint`/`Task` stub models to make the draft's relations
  compile. Delete those two lines instead.
- Do not `SELECT` to check key availability before inserting — same TOCTOU
  race `workspace.md` §2.1 documents.
- Do not put `ProjectRole` values into `ROLE_ORDER`. Two ladders, one file, is
  how `hasPermission` starts silently answering the wrong question.
- Do not let the validator decide who may do anything. It shapes input; §2.5
  decides access.

## Status — built

All five sections shipped. Verified, not assumed:

- `npx prisma migrate deploy` applied `20260908051254_project_module`, then
  `npx prisma generate` was run explicitly.
- `deriveKey`: `"Tizello Web App"` → `TWA`, `"Tizello"` → `TIZ`, `"🚀"` → `PROJ`,
  a six-word name → `ABGDE` (clamped to 5).
- `withUniqueKey` against a stub insert holding `TIZ` and `TIZ2` → `TIZ3`; the
  length clamp turns a retried `ABCDE` into `ABCD2`, not `ABCDE2`.
- `hasPermission('MEMBER', 'project:manage:any')` false,
  `hasPermission('ADMIN', 'project:manage:any')` true.
- Validator: empty update rejected, `key` in an update rejected,
  `endDate < startDate` rejected, `role: 'OWNER'` on a member add rejected,
  create with only `name` accepted (and defaulted to PLANNING / MEDIUM).
- `toProject` on a row carrying `taskCounter` and `deletedAt` emits neither;
  `toProjectMember` on a user row carrying `passwordHash` emits only
  id / name / email.

### Deviations from the sprint text

1. **`prisma migrate dev` cannot run here** — the shell is non-interactive and
   that command refuses to run outside a TTY. The migration was produced with
   `prisma migrate diff --from-config-datasource --to-schema` and applied with
   `prisma migrate deploy`, which is the same SQL by a non-interactive route.
   The `projects` table was confirmed empty first, so the NOT NULL `key` and
   `ownerId` columns needed no backfill.
2. **`endDate` is one shared Joi fragment** rather than written out twice. Its
   `Joi.ref('startDate')` resolves against the request, so on a PATCH it only
   fires when both dates are sent — a patch that moves one date past a STORED
   one is the service's check, and is noted there.
