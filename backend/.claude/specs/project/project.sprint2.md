# Sprint 2 — Read path: repository, `loadProject`, service, create/list/get

**Plan sections:** 5–7 · **Depends on:** 1 · **Blocks:** 3

## Goal

A project can be created, listed and fetched over HTTP, with the two-layer
authorization ladder implemented once in middleware. No write endpoints
beyond create.

## Tasks

### 2.1 `src/modules/project/project.repository.js`

- [ ] Read `workspace.repository.js` first and mirror it. Its header states
      the rule this file inherits: **`deletedAt: null` is unconditional on
      every read**, and there is no `includeDeleted` parameter.
- [ ] `createProjectWithOwner({ name, key, ..., workspaceId, ownerId })` —
      wrapped in `withUniqueKey`, and the retry wraps the **whole
      transaction** so a P2002 rolls back the `ProjectMember` insert too
      (`createWorkspaceWithOwner` documents exactly this trap). One
      transaction writes: the `Project`, and the `ProjectMember` row with
      `role: OWNER` (plan §2.4).
- [ ] `createProjectWithOwner` takes a `keyWasSupplied` flag, or the service
      chooses between two repository calls — a client-supplied key must
      **not** enter the retry loop (plan §2.2 / §8: `409`, not a silent
      rename). Pick one shape and say why in the header.
- [ ] `findProjectById(id)` — with `workspace: { select: { id: true } }` and
      no member filtering; `loadProject` does the access decision.
- [ ] `findProjectsForWorkspace(workspaceId, userId, { page, limit, status,
      priority, includeArchived, q, mine })` — `deletedAt: null` always,
      `isArchived: false` unless `includeArchived`, `q` as a
      case-insensitive `contains` across `name` and `key`, `mine` as
      `OR: [{ ownerId: userId }, { members: { some: { userId } } }]`.
      Returns `{ rows, total }` via `Promise.all([findMany, count])` on the
      same `where` — same shape as `findWorkspacesForUser`.
- [ ] Each row includes the caller's own `members: { where: { userId } }` so
      the service reads their project role without a second query.
- [ ] `findProjectMember(projectId, userId)`, `updateProject(id, patch)`,
      `setArchived(id, isArchived)`, `softDeleteProject(id)` — thin, no
      business rules. Later sprints use them; define them now while the file
      is being written.

### 2.2 `src/shared/middlewares/project.js`

- [ ] `loadProject` — `asyncHandler`, reads `req.params.projectId`, loads the
      project (`deletedAt: null`) plus the caller's `Membership` for its
      workspace and their `ProjectMember` row.
- [ ] **No workspace membership, or no such project → `404`,** never `403`.
      Copy the reasoning comment from `loadMembership`: confirming existence
      to someone with no access is itself the leak.
- [ ] Sets `req.project`, `req.membership`, `req.projectMember`, and
      `req.projectRole` (the effective role for the DTO: `OWNER` when
      `ownerId` matches, else the `ProjectMember` role, else `null`).
- [ ] `requireProjectWrite` — passes on `hasPermission(req.membership.role,
      PROJECT_MANAGE_ANY)` **or** `req.project.ownerId === req.user.id`
      **or** `req.projectMember?.role === 'MANAGER'`. Else `403` with the
      same message string the other permission middlewares use.
- [ ] `requireProjectOwner` — passes on `PROJECT_MANAGE_ANY` or
      `ownerId === req.user.id`. Else `403`.
- [ ] **Ownership is read from `req.project.ownerId` only** (plan §2.4). A
      `ProjectMember.role === 'OWNER'` check anywhere in this file is a bug.
- [ ] Header explains why this is a new file and not an addition to
      `permission.js` (plan §6): that file is workspace-scoped and imported by
      modules with no concept of a project.

### 2.3 `src/modules/project/project.service.js`

- [ ] Header states, like `workspace.service.js` does, that **authorization
      already happened** — this file trusts `req.membership` / `req.project`
      and never re-derives a role.
- [ ] `createProject(workspaceId, payload, user)` — derives the key when
      absent (`deriveKey`), uses the retry path only for a derived key,
      throws `AppError(409)` on P2002 for a supplied one. Returns
      `dto.toProject(row, ROLE OWNER)`.
- [ ] `listProjects(workspaceId, userId, query)` — returns
      `{ projects, page, limit, total }`; effective role per row is
      `ownerId === userId ? 'OWNER' : row.members[0]?.role ?? null`.
- [ ] `getProject(project, projectRole)` — the middleware already loaded it,
      so this is shaping plus the `notFound()` collapse for anything the
      middleware could not see. Mirror `workspace.service.js`'s single
      `notFound()` helper rather than scattering `AppError`s.
- [ ] Throws `AppError`, never touches `req`/`res`/Prisma.

### 2.4 `src/modules/project/project.controller.js`

- [ ] `create`, `list`, `getById`. Every one `asyncHandler`-wrapped at the
      route, no `try/catch` here, no business logic.
- [ ] **Every response through `ApiResponse`** — no `res.json()`. Status
      codes: `201` on create, `200` otherwise.

### 2.5 `src/modules/project/project.routes.js` + mounting

- [ ] Export **two** routers, as `invitation.routes.js` does:
      `workspaceRouter` (create + list, needs `{ mergeParams: true }` for
      `:workspaceId`) and `projectRouter` (get by id).
- [ ] Middleware order per route, matching every sibling: limiter → guard →
      validate → handler. Create also carries `loadMembership` +
      `requirePermission(PROJECT_CREATE)`; list carries `loadMembership` +
      `requirePermission(PROJECT_VIEW)`; get carries `loadProject`.
- [ ] Use `apiLimiter` for all three this sprint — `projectCreateLimiter`
      lands in sprint 3, and wiring a limiter that does not exist yet blocks
      this sprint on that one for no reason.
- [ ] `src/routes/index.js`: two `router.use(...)` lines,
      `/api/v1/projects` and
      `/api/v1/workspaces/:workspaceId/projects`, keeping the alphabetical
      ordering the file's own comment asks for.
- [ ] **`mergeParams: true` on `workspaceRouter`** — without it
      `req.params.workspaceId` is `undefined` and `loadMembership` throws a
      confusing `400 workspaceId is required`.

## Definition of done

Verified against a running server and the live database, not by reading code.

- [ ] `POST /workspaces/:id/projects` with only `name: "Tizello Web"` →
      `201`, key `TWA`, `status: PLANNING`, `priority: MEDIUM`, caller is
      `ownerId`, and a `project_members` row exists with `role = OWNER`.
- [ ] A second project named `"Tizello Web"` in the same workspace → key
      `TWA2`. The same name in a **different** workspace → `TWA` again
      (the unique is compound).
- [ ] `POST` with an explicit `key: "TWA"` that is taken → `409`, **not** a
      silently renamed `TWA3`.
- [ ] `GET /workspaces/:id/projects` — pagination, `q` matching name and key,
      `status` filter, `mine`, and `includeArchived` all behave; a workspace
      MEMBER sees projects they are not a member of (plan §2.5 step 4).
- [ ] `GET /projects/:id` — workspace member `200`; non-member of the
      workspace `404`; nonexistent id `404`; **identical body for both**.
- [ ] Response never contains `taskCounter` or `deletedAt`.
- [ ] `viewerRole` is `OWNER` for the creator, `null` for a workspace member
      with no `ProjectMember` row.
- [ ] No `console.*` added anywhere; every new file has its header.

## Traps

- Do not let the service check roles. If a rule feels like it needs an `if
  (role …)` in the service, it belongs in `shared/middlewares/project.js`.
- Do not return `403` from `loadProject` for a non-member. `404` is the
  contract and the reason is written into `loadMembership` already.
- Do not forget `mergeParams: true`. The failure looks like a permission bug.
- Do not let the P2002 retry wrap only the project insert — the membership
  insert must roll back with it.
- Do not add an `includeDeleted` flag to the repository "just for testing".
