# Sprint 2 — Read path: repository, `loadProject`, service, create/list/get

**Plan sections:** 5–7 · **Depends on:** 1 · **Blocks:** 3

## Goal

A project can be created, listed and fetched over HTTP, with the two-layer
authorization ladder implemented once in middleware. No write endpoints
beyond create.

## Tasks

### 2.1 `src/modules/project/project.repository.js`

- [x] Read `workspace.repository.js` first and mirror it. Its header states
      the rule this file inherits: **`deletedAt: null` is unconditional on
      every read**, and there is no `includeDeleted` parameter.
- [x] `createProjectWithOwner({ name, key, ..., workspaceId, ownerId })` —
      wrapped in `withUniqueKey`, and the retry wraps the **whole
      transaction** so a P2002 rolls back the `ProjectMember` insert too
      (`createWorkspaceWithOwner` documents exactly this trap). One
      transaction writes: the `Project`, and the `ProjectMember` row with
      `role: OWNER` (plan §2.4).
- [x] `createProjectWithOwner` takes a `keyWasSupplied` flag, or the service
      chooses between two repository calls — a client-supplied key must
      **not** enter the retry loop (plan §2.2 / §8: `409`, not a silent
      rename). Pick one shape and say why in the header.
- [x] `findProjectById(id)` — with `workspace: { select: { id: true } }` and
      no member filtering; `loadProject` does the access decision.
- [x] `findProjectsForWorkspace(workspaceId, userId, { page, limit, status,
      priority, includeArchived, q, mine })` — `deletedAt: null` always,
      `isArchived: false` unless `includeArchived`, `q` as a
      case-insensitive `contains` across `name` and `key`, `mine` as
      `OR: [{ ownerId: userId }, { members: { some: { userId } } }]`.
      Returns `{ rows, total }` via `Promise.all([findMany, count])` on the
      same `where` — same shape as `findWorkspacesForUser`.
- [x] Each row includes the caller's own `members: { where: { userId } }` so
      the service reads their project role without a second query.
- [x] `findProjectMember(projectId, userId)`, `updateProject(id, patch)`,
      `setArchived(id, isArchived)`, `softDeleteProject(id)` — thin, no
      business rules. Later sprints use them; define them now while the file
      is being written.

### 2.2 `src/shared/middlewares/project.js`

- [x] `loadProject` — `asyncHandler`, reads `req.params.projectId`, loads the
      project (`deletedAt: null`) plus the caller's `Membership` for its
      workspace and their `ProjectMember` row.
- [x] **No workspace membership, or no such project → `404`,** never `403`.
      Copy the reasoning comment from `loadMembership`: confirming existence
      to someone with no access is itself the leak.
- [x] Sets `req.project`, `req.membership`, `req.projectMember`, and
      `req.projectRole` (the effective role for the DTO: `OWNER` when
      `ownerId` matches, else the `ProjectMember` role, else `null`).
- [x] `requireProjectWrite` — passes on `hasPermission(req.membership.role,
      PROJECT_MANAGE_ANY)` **or** `req.project.ownerId === req.user.id`
      **or** `req.projectMember?.role === 'MANAGER'`. Else `403` with the
      same message string the other permission middlewares use.
- [x] `requireProjectOwner` — passes on `PROJECT_MANAGE_ANY` or
      `ownerId === req.user.id`. Else `403`.
- [x] **Ownership is read from `req.project.ownerId` only** (plan §2.4). A
      `ProjectMember.role === 'OWNER'` check anywhere in this file is a bug.
- [x] Header explains why this is a new file and not an addition to
      `permission.js` (plan §6): that file is workspace-scoped and imported by
      modules with no concept of a project.

### 2.3 `src/modules/project/project.service.js`

- [x] Header states, like `workspace.service.js` does, that **authorization
      already happened** — this file trusts `req.membership` / `req.project`
      and never re-derives a role.
- [x] `createProject(workspaceId, payload, user)` — derives the key when
      absent (`deriveKey`), uses the retry path only for a derived key,
      throws `AppError(409)` on P2002 for a supplied one. Returns
      `dto.toProject(row, ROLE OWNER)`.
- [x] `listProjects(workspaceId, userId, query)` — returns
      `{ projects, page, limit, total }`; effective role per row is
      `ownerId === userId ? 'OWNER' : row.members[0]?.role ?? null`.
- [x] `getProject(project, projectRole)` — the middleware already loaded it,
      so this is shaping plus the `notFound()` collapse for anything the
      middleware could not see. Mirror `workspace.service.js`'s single
      `notFound()` helper rather than scattering `AppError`s.
- [x] Throws `AppError`, never touches `req`/`res`/Prisma.

### 2.4 `src/modules/project/project.controller.js`

- [x] `create`, `list`, `getById`. Every one `asyncHandler`-wrapped at the
      route, no `try/catch` here, no business logic.
- [x] **Every response through `ApiResponse`** — no `res.json()`. Status
      codes: `201` on create, `200` otherwise.

### 2.5 `src/modules/project/project.routes.js` + mounting

- [x] Export **two** routers, as `invitation.routes.js` does:
      `workspaceRouter` (create + list, needs `{ mergeParams: true }` for
      `:workspaceId`) and `projectRouter` (get by id).
- [x] Middleware order per route, matching every sibling: limiter → guard →
      validate → handler. Create also carries `loadMembership` +
      `requirePermission(PROJECT_CREATE)`; list carries `loadMembership` +
      `requirePermission(PROJECT_VIEW)`; get carries `loadProject`.
- [x] Use `apiLimiter` for all three this sprint — `projectCreateLimiter`
      lands in sprint 3, and wiring a limiter that does not exist yet blocks
      this sprint on that one for no reason.
- [x] `src/routes/index.js`: two `router.use(...)` lines,
      `/api/v1/projects` and
      `/api/v1/workspaces/:workspaceId/projects`, keeping the alphabetical
      ordering the file's own comment asks for.
- [x] **`mergeParams: true` on `workspaceRouter`** — without it
      `req.params.workspaceId` is `undefined` and `loadMembership` throws a
      confusing `400 workspaceId is required`.

## Definition of done

Verified against a running server and the live database, not by reading code.

- [x] `POST /workspaces/:id/projects` with only `name: "Tizello Web"` →
      `201`, key `TWA`, `status: PLANNING`, `priority: MEDIUM`, caller is
      `ownerId`, and a `project_members` row exists with `role = OWNER`.
- [x] A second project named `"Tizello Web"` in the same workspace → key
      `TWA2`. The same name in a **different** workspace → `TWA` again
      (the unique is compound).
- [x] `POST` with an explicit `key: "TWA"` that is taken → `409`, **not** a
      silently renamed `TWA3`.
- [x] `GET /workspaces/:id/projects` — pagination, `q` matching name and key,
      `status` filter, `mine`, and `includeArchived` all behave; a workspace
      MEMBER sees projects they are not a member of (plan §2.5 step 4).
- [x] `GET /projects/:id` — workspace member `200`; non-member of the
      workspace `404`; nonexistent id `404`; **identical body for both**.
- [x] Response never contains `taskCounter` or `deletedAt`.
- [x] `viewerRole` is `OWNER` for the creator, `null` for a workspace member
      with no `ProjectMember` row.
- [x] No `console.*` added anywhere; every new file has its header.

## Traps

- Do not let the service check roles. If a rule feels like it needs an `if
  (role …)` in the service, it belongs in `shared/middlewares/project.js`.
- Do not return `403` from `loadProject` for a non-member. `404` is the
  contract and the reason is written into `loadMembership` already.
- Do not forget `mergeParams: true`. The failure looks like a permission bug.
- Do not let the P2002 retry wrap only the project insert — the membership
  insert must roll back with it.
- Do not add an `includeDeleted` flag to the repository "just for testing".

## Status — built

Every endpoint verified against the running server on :5001 and the live
database, with three real users: a workspace OWNER, a plain workspace MEMBER
with no `ProjectMember` row, and a stranger to the workspace.

- Create with only `name: "Tizello Web"` → `201`, `status: PLANNING`,
  `priority: MEDIUM`, caller is `ownerId`, and a `project_members` row with
  `role = OWNER` exists — confirmed by reading the rows, not the response.
- A second `"Tizello Web"` in the same workspace → key `TW2`. The same name in
  a different workspace → `TW` again; the unique is compound.
- `POST` with an explicit `key: "TW"` that is taken → `409`, not a silent
  rename. An explicit free key (`MOB`) → `201` with that exact key.
- List: pagination (`limit=2&page=2` returns the 3rd row), `q` matching name
  (`mobile` → MOB) and key (`TW` → TW, TW2), `status=ACTIVE`, and `mine=true`
  (3 for the owner, 0 for the member who owns none).
- The plain workspace MEMBER sees all three projects with `viewerRole: null` —
  plan §2.5 step 4. The stranger gets `404` from `loadMembership`.
- `GET /projects/:id`: owner `200`, workspace member `200`, stranger `404`,
  nonexistent id `404` — the last two byte-identical
  (`{"message":"Project not found","code":"NOT_FOUND"}`).
- No response carried `taskCounter` or `deletedAt`.

### Deviations from the sprint text

1. **The DoD's expected key was wrong, not the code.** It said
   `name: "Tizello Web"` → `TWA`; two words yield two initials, so `TW` is
   correct. `TWA` comes from "Tizello Web **App**", which is the example in
   sprint 1. Corrected above.
2. **Two repository create functions, not one with a flag.**
   `createProjectWithKey` (no retry, `P2002` propagates to become a `409`) and
   `createProjectWithDerivedKey` (wrapped in `withUniqueKey`). A boolean
   parameter would have put the client-vs-derived decision inside the
   repository, which is a business rule; the service now picks the function and
   the difference is visible at the call site.
3. **`getById` does not re-query.** `loadProject` already loaded the row to
   decide whether the request was allowed, so the controller passes
   `req.project` straight to the DTO — a second read can only disagree with the
   one authorization was based on.
