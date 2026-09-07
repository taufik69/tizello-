# Sprint 2 — Repository, service, create/list/get

**Plan sections:** 2.3, 3 · **Depends on:** sprint 1 · **Blocks:** 3

## Goal

A workspace can be created (caller becomes OWNER), listed, and fetched by id,
end to end through real HTTP.

## Tasks

### 2.1 `src/modules/workspace/workspace.repository.js`

- [ ] `createWorkspaceWithOwner({ name, description, icon, color, ownerId })`
      — one `prisma.$transaction`: generate slug via `withUniqueSlug`
      (sprint 1), insert `Workspace`, insert `Membership{ userId: ownerId,
      workspaceId, role: 'OWNER' }`. Returns the workspace row.
- [ ] `findWorkspaceById(id)` — `where: { id, deletedAt: null }`. Never
      returns a soft-deleted row, full stop — no caller passes a flag to see
      one.
- [ ] `findWorkspacesForUser(userId, { page, limit, includeArchived })` —
      join through `Membership`, `deletedAt: null` unconditional,
      `isArchived: false` unless `includeArchived`. Returns `{ rows, total }`
      for `ApiResponse.paginated`.
- [ ] Each membership-derived row needs the caller's own role attached for
      the DTO — either `include: { memberships: { where: { userId } } }` on
      the workspace query, or a second lookup. Pick one, keep it consistent
      between `findWorkspaceById`-for-a-member and the list query.
- [ ] No `AppError`, no HTTP concepts — plain Prisma, matching
      `auth.repository.js`.

### 2.2 `src/modules/workspace/workspace.service.js`

- [ ] `createWorkspace({ name, description, icon, color }, user)` — calls
      the repository; no permission check (§*Guards*, create has none).
- [ ] `listMyWorkspaces(userId, query)` — calls repository, maps rows
      through `toWorkspace(row, row.role)`.
- [ ] `getWorkspace(workspaceId, membership)` — takes the already-loaded
      `req.membership` from the controller rather than re-querying it; the
      route's `loadMembership` middleware already proved access and resolved
      the role, so the service reuses that instead of a second round trip.
- [ ] Every expected failure is `AppError`, never a bare `Error` — matches
      `module-consistency` skill.

### 2.3 `src/modules/workspace/workspace.controller.js`

- [ ] `create` — `service.createWorkspace(req.body, req.user)` →
      `ApiResponse.success(res, httpStatus.CREATED, 'Workspace created', {
      workspace })`.
- [ ] `list` — `service.listMyWorkspaces(req.user.id, req.query)` →
      `ApiResponse.paginated(...)`.
- [ ] `getById` — `service.getWorkspace(req.params.workspaceId,
      req.membership)` → `ApiResponse.success(res, httpStatus.OK, 'Workspace
      fetched', { workspace })`.
- [ ] No `try/catch` anywhere in this file.

### 2.4 `src/modules/workspace/workspace.routes.js`

- [ ] `POST /` → `authGuard`, `validate(createWorkspaceSchema)`,
      `asyncHandler(controller.create)`. **No `workspaceCreateLimiter`
      yet** — that lands in sprint 3 alongside the limiter file edit; do not
      block sprint 2 on it, but do not forget it either.
- [ ] `GET /` → `authGuard`,
      `validate(listWorkspacesQuerySchema, 'query')` — `validate` already
      supports a `target` argument (`shared/middlewares/validate.js`), so
      this is a normal call, not a new capability.
- [ ] `GET /:workspaceId` → `authGuard`, `loadMembership`,
      `asyncHandler(controller.getById)`.

### 2.5 Mount

- [ ] `src/routes/index.js` — `router.use('/api/v1/workspaces',
      workspaceRoutes)`. One line, alphabetical among the existing feature
      routes, never an edit to `app.js`.

## Definition of done

- [ ] `POST /api/v1/workspaces {name}` → `201`, `data.workspace.role ===
      "OWNER"`, a `Membership` row exists for the caller.
- [ ] `GET /api/v1/workspaces` → the created workspace appears, with
      `pagination.total === 1`.
- [ ] `GET /api/v1/workspaces/:id` as the owner → `200`.
- [ ] `GET /api/v1/workspaces/:id` as a different authenticated user (no
      membership) → `404`, not `403`.
- [ ] `GET /api/v1/workspaces/:id` for a nonexistent id → `404`, same shape
      as the non-member case (§*Guards* — indistinguishable on purpose).

## Traps

- Do not let `getWorkspace` re-run `loadMembership`'s query — that duplicates
  a round trip the route already paid for.
- Do not expose `plan`/billing fields through `toWorkspace` just because
  they're on the Prisma row — sprint 1's DTO already whitelists them out;
  don't widen it here.
- `workspaceCreateLimiter` is sprint 3's job, not this sprint's — don't
  half-wire it now and forget the other half.
