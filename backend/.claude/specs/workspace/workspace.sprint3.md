# Sprint 3 — Update, archive, delete, rate limiter, verification

**Plan sections:** 3, 4 · **Depends on:** sprint 2 · **Blocks:** none

## Goal

The module is complete against `docs/api/workspace.md`: every endpoint in
the contract exists, is guarded correctly, and has been exercised against a
running server.

## Tasks

### 3.1 `src/shared/middlewares/rateLimiter.js`

- [ ] `workspaceCreateLimiter = failClosed(limiter({ name: 'workspace-create',
      windowMs: 60 * 60 * 1000, max: 10 }))` — same shape as
      `registerLimiter`. Add to the file's `export` block.
- [ ] Wire it onto `POST /` in `workspace.routes.js` (sprint 2 deliberately
      left this unwired).

### 3.2 `workspace.repository.js` additions

- [ ] `updateWorkspace(id, patch)` — plain `prisma.workspace.update`.
      `patch` is already Joi-normalized; this function does not re-validate.
- [ ] `setArchived(id, isArchived)` — same shape, one column.
- [ ] `softDeleteWorkspace(id)` — `update({ deletedAt: new Date() })`. Does
      **not** touch `Membership` or `Invitation` rows — plan §*Open
      questions* defers a real purge.

### 3.3 `workspace.service.js` additions

- [ ] `updateWorkspace(workspaceId, patch, membership)` — no permission
      check inside the service; that is `requirePermission`'s job at the
      route layer (module-consistency: services hold business rules, not
      authorization).
- [ ] `setArchived(workspaceId, isArchived, membership)`.
- [ ] `deleteWorkspace(workspaceId, membership)` — no return value; the
      controller sends `data: null`.

### 3.4 `workspace.controller.js` additions

- [ ] `update`, `archive`, `remove` — same thin shape as sprint 2's three
      handlers. `remove` responds `200` with `data: null` per the contract
      doc (not `204` — see `docs/api/workspace.md` §6 for why this module
      uses `200` here rather than the `204` pattern `auth`'s `/logout` uses).

### 3.5 `workspace.routes.js` additions

- [ ] `PATCH /:workspaceId` → `authGuard`, `loadMembership`,
      `requirePermission(PERMISSIONS.WORKSPACE_UPDATE)`,
      `validate(updateWorkspaceSchema)`, `asyncHandler(controller.update)`.
- [ ] `PATCH /:workspaceId/archive` → same guard chain,
      `validate(archiveWorkspaceSchema)`, `asyncHandler(controller.archive)`.
- [ ] `DELETE /:workspaceId` → `authGuard`, `loadMembership`,
      `requirePermission(PERMISSIONS.WORKSPACE_DELETE)`,
      `asyncHandler(controller.remove)`.
- [ ] Guard/limiter order matches every other module: limiter → guard →
      validate → handler, per `auth.routes.js`'s documented convention.

### 3.6 Verification pass

- [ ] Every Definition-of-done item in sprints 1 and 2, re-checked against
      the finished module (a sprint 1 dto detail is easy to drift by
      sprint 3).
- [ ] `PATCH .../:id` as MEMBER role → `403 FORBIDDEN`.
- [ ] `PATCH .../:id/archive` as ADMIN → `200`, `isArchived: true`; a
      subsequent `GET /workspaces` (default, no `includeArchived`) omits it;
      `?includeArchived=true` includes it.
- [ ] `DELETE .../:id` as ADMIN (not OWNER) → `403`.
- [ ] `DELETE .../:id` as OWNER → `200`; a subsequent `GET .../:id` → `404`;
      a second `DELETE` → `404`, not `200` (contract doc §6 — not
      idempotent-as-200, unlike auth's logout).
- [ ] `grep -rn "plan\|seatLimit\|lastPaymentAt\|planExpiresAt"
      src/modules/workspace/` returns nothing outside the schema-facing
      repository types — confirms plan §2.4 held through implementation.

## Traps

- Do not make `DELETE` return `204` — the contract doc specifies `200` with
  `data: null`; matching `auth`'s `/logout` shape here would be an
  undocumented divergence.
- Do not let `updateWorkspace`'s service function re-check permissions —
  that duplicates `requirePermission` and, if the two ever disagree, hides
  which one is authoritative.
- Do not forget the rate limiter is a two-file change (limiter definition +
  route wiring) — sprint 2 shipped `POST /` deliberately unlimited as a
  known gap, not an oversight; closing it is this sprint's job.
