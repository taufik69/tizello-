# Plan — Project module

Naming note: the request said `project.plan` and `project.sprint-1.md`. This
repo already has `.claude/plan/<module>.md` + `.claude/specs/<module>/<module>.sprintN.md`
(auth, workspace). Consistency with the existing tree wins, so this is
`.claude/plan/project.md` and `.claude/specs/project/project.sprint1.md`.

## 1. What already exists

- **`Project` stub model** — `id`, `workspaceId`, `name`, timestamps, a
  `Workspace` back-relation and `@@map("projects")`. Added by the workspace
  migration purely so `Workspace.projects` compiled, with an explicit comment
  saying "extend this model when the project module actually lands rather
  than guessing its shape now". This module is that landing.
- **`Workspace` + `Membership` + `Role`** — a project always lives inside a
  workspace, so every project request is already inside a workspace
  authorization context. `loadMembership` / `requirePermission` /
  `requireAtLeast` (`shared/middlewares/permission.js`) work today and are
  reused unchanged.
- **`shared/constants/roles.js`** — workspace roles + permission table. It has
  **no** `PROJECT_*` permissions. This module adds them (§4).
- **`shared/utils/slug.js`** — `generateSlug` + `withUniqueSlug(base, tryInsert)`,
  a P2002-retry loop that takes an insert callback. The project `key`
  generator (§2.2) is the same shape and reuses the same retry technique.
- **Two-mount precedent** — the invitation module exports two routers from one
  file (`workspaceRouter`, `tokenRouter`) mounted at two prefixes. Projects
  need the same trick (§5).
- **Contract-doc requirement** — `CLAUDE.md` mandates `docs/api/project.md`
  before this module can be called done. It does not exist yet.

## 2. Design decisions

### 2.1 The draft schema is adopted, with six corrections

The model in the request is the starting point, not the final shape. Six
changes, each because the existing codebase already answered the same
question a different way:

| # | Draft | Change | Why |
|---|---|---|---|
| 1 | `ProjectStatus.ARCHIVED` **and** `isArchived Boolean` | Drop `ARCHIVED` from the enum | Exactly the ambiguity `workspace.md` §2.2 already rejected — "status = ARCHIVED but isArchived = false" is representable and meaningless. `isArchived` is the archive axis, `status` is the lifecycle axis. They are independent. |
| 2 | No `@@map` | `@@map("projects")`, `@@map("project_members")` | Every table in this schema is snake_case-mapped; the stub `Project` already has `@@map("projects")`. |
| 3 | Bare relations | `onDelete: Cascade` on `workspace`, both `ProjectMember` relations; `onDelete: Restrict` on `Project.owner` | The stub already cascades from `Workspace`. Restrict on owner because deleting a user must not silently orphan projects — it should fail loudly until ownership is transferred. |
| 4 | Only `@@unique` constraints | `@@index([workspaceId])`, `@@index([ownerId])`, `@@index([workspaceId, status])`, `@@index([projectId])` on `ProjectMember` | Every list query in §5 filters by `workspaceId` (+ often `status`); "my projects" filters by `ownerId`. The compound uniques do not cover these. |
| 5 | `sprints Sprint[]`, `tasks Task[]` | **Omitted** this module | `Sprint` and `Task` do not exist. Adding stubs for them repeats the guess the `Project` stub's own comment warns against. They get added by their own modules, the way `Project` was added by workspace's. |
| 6 | No task counter | `taskCounter Int @default(0)` | See §2.3. |

### 2.2 `key` — server-derived, unique per workspace, immutable

`key` is the human-facing task ID prefix (`TIZ` → `TIZ-1`). Rules:

- **Derived from `name` when the client omits it**: strip non-alphanumerics,
  uppercase, take the first letter of each word (or the first 3 chars of a
  single word), pad/trim to 2–5 chars, fall back to `PROJ`.
- **Accepted from the client when given**, unlike workspace `slug` — teams
  care what their ticket prefix says, and it is displayed on every task. This
  is a deliberate divergence from `workspace.md` §2.1, not an oversight.
  Validated `/^[A-Z][A-Z0-9]{1,4}$/`.
- **Collision handling is by numeric suffix on a P2002 retry**, capped at 20
  attempts, never a `SELECT`-then-`INSERT` — same TOCTOU race, same fix as
  `workspace.md` §2.1. The unique is compound (`workspaceId, key`), so the
  retry catches P2002 on that constraint specifically.
  - Nuance: when the client **explicitly supplied** a key that collides, do
    **not** silently suffix it — return `409`. Silent renaming is fine for a
    server-generated value and hostile for one the user typed.
- **Immutable after create.** Every task ever created carries `KEY-n` in
  places the database does not own (commit messages, chat, bookmarks).
  Rewriting the prefix orphans all of it. Tracked as an open question (§8)
  rather than a feature.

### 2.3 `taskCounter` exists now, is written by nobody now

`TIZ-1, TIZ-2, …` needs a per-project monotonic counter. `count(tasks) + 1`
is wrong under concurrency and wrong after any delete. The correct
implementation is an atomic `UPDATE … SET taskCounter = taskCounter + 1
RETURNING` inside the task-creation transaction — which belongs to the Task
module, not this one.

The **column** ships now anyway, so the Task module needs no migration for
it, exactly as `Workspace`'s billing columns shipped ahead of SSLCommerz
(`workspace.md` §2.4). Same rule applies: no service, DTO, or endpoint in
this plan reads or writes it, and it never appears in a response.

### 2.4 Ownership: `ownerId` is authoritative, the `OWNER` member row is a mirror

The draft carries both an `ownerId` column and `ProjectRole.OWNER` — two
places that could disagree about who owns a project. `workspace.md` §2.3
solved the same question the opposite way (membership row only, no column).

Resolution, and the rule that makes it safe:

- **`Project.ownerId` is the only thing any authorization check reads.**
  Never `ProjectMember.role === 'OWNER'`.
- **A `ProjectMember` row with `role: OWNER` is written in the same
  transaction as the project**, so `GET /projects/:id/members` is one query
  returning one uniform shape instead of a synthesized-owner special case.
- **Ownership transfer updates both, in one transaction** (sprint 4). A
  project whose `ownerId` has no matching `OWNER` member row is an invariant
  violation, never a valid intermediate state.

The denormalization is deliberate and its cost is one rule to hold: reads for
authorization go to the column, reads for display go to the rows.

### 2.5 Two authorization layers, and the escape hatch

A project request has two roles in play: the caller's **workspace** role
(`Membership.role`) and their **project** role (`ProjectMember.role`). Both
matter, and the resolution order is fixed:

1. **No workspace membership → `404`.** Handled by the existing
   `loadMembership`; a non-member never learns the project exists.
2. **Workspace OWNER/ADMIN → full access to every project in the workspace**,
   regardless of `ProjectMember`. Without this, a workspace admin can be
   locked out of a project inside their own workspace by a collaborator who
   removes them — and the only recovery is direct database access.
3. **Otherwise the project role decides** — `OWNER`/`MANAGER` may write,
   `COLLABORATOR` may read.
4. **Workspace MEMBER with no `ProjectMember` row → read-only.** Projects are
   visible workspace-wide; there is no private-project flag in this schema.
   See §8.

This lives in one new middleware, `loadProject` (§6), never in per-service
`if (role === …)` checks — the same reason `permission.js` exists at all.

### 2.6 Archive and soft-delete, unchanged from workspace

`isArchived` (reversible, hidden from the default list) and `deletedAt`
(permanent, excluded from every read unconditionally at the repository layer)
are two columns, two operations. The repository grows **no** `includeDeleted`
parameter — `workspace.repository.js`'s header states the rule and this
module follows it.

### 2.7 `Priority` is shared, deliberately

The `Priority` enum is generically named because `Task` will want the exact
same four values. It is defined once here rather than as `ProjectPriority` +
a near-identical `TaskPriority` later. `ProjectStatus` stays project-specific
— task status is a different set of values and merging them would be wrong.

## 3. Schema — final shape

```prisma
enum ProjectStatus { PLANNING ACTIVE ON_HOLD BACKLOG COMPLETED CANCELLED }
enum Priority      { LOW MEDIUM HIGH URGENT }
enum ProjectRole   { OWNER MANAGER COLLABORATOR }

model Project {
  id          String        @id @default(cuid())
  name        String
  key         String
  description String?
  status      ProjectStatus @default(PLANNING)
  priority    Priority      @default(MEDIUM)
  icon        String?
  color       String?
  startDate   DateTime?
  endDate     DateTime?

  taskCounter Int           @default(0)   // schema-only — plan §2.3

  workspaceId String
  workspace   Workspace     @relation(fields: [workspaceId], references: [id], onDelete: Cascade)

  ownerId     String
  owner       User          @relation("ProjectOwner", fields: [ownerId], references: [id], onDelete: Restrict)

  members     ProjectMember[]

  isArchived  Boolean       @default(false)
  deletedAt   DateTime?
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt

  @@unique([workspaceId, key])
  @@index([workspaceId])
  @@index([ownerId])
  @@index([workspaceId, status])
  @@map("projects")
}

model ProjectMember {
  id        String      @id @default(cuid())
  projectId String
  project   Project     @relation(fields: [projectId], references: [id], onDelete: Cascade)
  userId    String
  user      User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  role      ProjectRole @default(COLLABORATOR)
  createdAt DateTime    @default(now())

  @@unique([projectId, userId])
  @@index([projectId])
  @@map("project_members")
}
```

`User` gains two back-relations: `ownedProjects Project[] @relation("ProjectOwner")`
and `projectMemberships ProjectMember[]`. `Workspace.projects` already exists.

## 4. Permissions — new entries in `shared/constants/roles.js`

Workspace-level permissions only. Project-level role checks are not
permissions — they are resolved by `loadProject` (§6), because the ladder is
per-project data, not per-workspace-role capability.

| Permission | OWNER | ADMIN | MEMBER |
|---|---|---|---|
| `PROJECT_VIEW` (`project:view`) | ✅ | ✅ | ✅ |
| `PROJECT_CREATE` (`project:create`) | ✅ | ✅ | ✅ |
| `PROJECT_MANAGE_ANY` (`project:manage:any`) | ✅ | ✅ | ❌ |

`PROJECT_CREATE` is granted to `MEMBER` on purpose: a workspace where only
admins may start a project is a workflow decision no code here should make
unilaterally. Flipping it is a one-line change in the table — that is the
whole point of the table existing.

`PROJECT_MANAGE_ANY` is the §2.5 step-2 escape hatch, expressed as a
permission so it is greppable rather than a hard-coded `role === 'ADMIN'`.

## 5. Endpoint contract

Two mounts, one module — `workspaceRouter` under
`/api/v1/workspaces/:workspaceId/projects` (create/list, needs a workspace in
the path for `loadMembership`) and `projectRouter` under `/api/v1/projects`
(everything else — a project id is globally unique, and forcing the client to
carry the workspace id it can already read off the project is noise). Exactly
the invitation module's split.

| # | Method | Path | Guards | Limiter | Who |
|---|---|---|---|---|---|
| 1 | POST | `/workspaces/:workspaceId/projects` | `authGuard` + `loadMembership` + `requirePermission(PROJECT_CREATE)` | `projectCreateLimiter` 30/hr | any workspace member |
| 2 | GET | `/workspaces/:workspaceId/projects` | `authGuard` + `loadMembership` + `requirePermission(PROJECT_VIEW)` | `apiLimiter` | any workspace member |
| 3 | GET | `/projects/:projectId` | `authGuard` + `loadProject` | `apiLimiter` | any workspace member |
| 4 | PATCH | `/projects/:projectId` | + `requireProjectWrite` | `apiLimiter` | ws OWNER/ADMIN, proj OWNER/MANAGER |
| 5 | PATCH | `/projects/:projectId/archive` | + `requireProjectWrite` | `apiLimiter` | as above |
| 6 | DELETE | `/projects/:projectId` | + `requireProjectOwner` | `apiLimiter` | ws OWNER/ADMIN, proj OWNER |
| 7 | GET | `/projects/:projectId/members` | `authGuard` + `loadProject` | `apiLimiter` | any workspace member |
| 8 | POST | `/projects/:projectId/members` | + `requireProjectWrite` | `apiLimiter` | ws OWNER/ADMIN, proj OWNER/MANAGER |
| 9 | PATCH | `/projects/:projectId/members/:userId` | + `requireProjectWrite` | `apiLimiter` | as above |
| 10 | DELETE | `/projects/:projectId/members/:userId` | + `requireProjectWrite` | `apiLimiter` | as above |
| 11 | PATCH | `/projects/:projectId/transfer-ownership` | + `requireProjectOwner` | `apiLimiter` | ws OWNER, proj OWNER |

List (#2) query: `page`, `limit`, `status`, `priority`, `includeArchived`,
`q` (name/key contains, case-insensitive), `mine` (owner or member).

## 6. New middleware — `loadProject`

`shared/middlewares/project.js`, three exports, all after `authGuard`:

- **`loadProject`** — reads `req.params.projectId`, loads the project
  (`deletedAt: null`) with the caller's `Membership` for its workspace and
  their `ProjectMember` row. No workspace membership → `404` (never `403`;
  same leak argument as `loadMembership`). Sets `req.project`,
  `req.membership`, `req.projectMember`.
- **`requireProjectWrite`** — passes when the workspace role holds
  `PROJECT_MANAGE_ANY`, **or** `req.project.ownerId === req.user.id`, **or**
  `req.projectMember?.role === MANAGER`. Else `403`.
- **`requireProjectOwner`** — passes on `PROJECT_MANAGE_ANY` or
  `ownerId === req.user.id`. Else `403`.

Why a new file rather than extending `permission.js`: that file is
workspace-scoped by construction and is imported by modules that have no
concept of a project. Keeping the project ladder beside it, not inside it,
keeps both greppable.

## 7. Files

```
prisma/schema.prisma                        (edit — replace Project stub, add ProjectMember + 3 enums, 2 User back-relations)
prisma/migrations/<ts>_project_module/      (new)
src/shared/constants/roles.js               (edit — 3 PROJECT_* permissions + grants)
src/shared/utils/projectKey.js              (new — §2.2)
src/shared/middlewares/project.js           (new — §6)
src/shared/middlewares/rateLimiter.js       (edit — projectCreateLimiter)
src/modules/project/project.routes.js       (new — two routers)
src/modules/project/project.controller.js   (new)
src/modules/project/project.service.js      (new)
src/modules/project/project.repository.js   (new)
src/modules/project/project.dto.js          (new)
src/modules/project/project.validator.js    (new)
src/routes/index.js                         (edit — two mounts)
docs/api/project.md                         (new — required by CLAUDE.md)
```

Six module files, no more — `module-consistency`. Member endpoints live in
the same six files, not a `projectMember/` module: `ProjectMember` has no
lifecycle independent of its project.

## 8. Failure modes

| Condition | Behaviour | Why |
|---|---|---|
| Redis unreachable | `429`, fail closed | Every existing limiter's `failClosed` wrapper. |
| Non-member of the workspace hits any project route | `404` | Confirming a project exists is the leak — `loadMembership`'s existing rule. |
| Client-supplied `key` collides | `409` | A key the user typed must not be silently renamed — §2.2. |
| Derived `key` collides | Suffix retry, transparent | Server-generated, so a suffix is the expected behaviour, not a surprise. |
| Key retry loop exhausted (20) | `500` | Unreachable in practice; a cap beats an infinite loop. |
| `endDate < startDate` | `422` from the validator | Not a service check — it is a shape rule and the validator is where shape rules live. |
| Adding a member who is not in the workspace | `422` | A project member who cannot see the workspace is unreachable state. |
| Removing / demoting the project owner via the member endpoints | `409` | Ownership changes go through #11 only, so the §2.4 invariant has exactly one write path. |
| Deleting a user who owns projects | Postgres `Restrict` error → `409` | §2.1 correction 3. Loud beats orphaned. |

## 9. Rate limiting

One new limiter: `projectCreateLimiter` (1h / 30), same `failClosed` wrapper
and `limiter({ name, windowMs, max })` factory as every sibling. 30 rather
than the workspace's 10 — projects are created far more often than
workspaces, and the limiter is abuse protection, not a quota.

## 10. Build order

Sprints in `.claude/specs/project/README.md`. Sequential:
schema + permissions + key util + validator + dto (1) →
repository + service + create/list/get + mounts (2) →
update/archive/delete + limiter + contract doc (3) →
members + ownership transfer + full verification (4).

## 11. Open questions — not blocking any sprint

1. **Key rename.** Immutable today (§2.2). If it ever becomes editable it
   needs a task-ID backfill and a redirect story, not just an `UPDATE`.
2. **Private projects.** No `visibility` column, so every workspace member can
   read every project (§2.5 step 4). Adding one later is a migration plus a
   `where` clause in one repository function — cheap, and deliberately not
   guessed at now.
3. **Purge policy.** Same open question `workspace.md` §8 already tracks;
   soft-deleted projects are never hard-deleted by anything in this plan.
4. **Cascade on workspace soft-delete.** Soft-deleting a workspace does not
   set `deletedAt` on its projects — they become unreachable via the API
   because every project read goes through workspace membership, but the rows
   stay live. Revisit with the purge policy, not before.
