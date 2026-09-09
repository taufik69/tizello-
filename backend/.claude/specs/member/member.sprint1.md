# Sprint 1 — Contract, six files, and the roster move

**Plan sections:** 1, 2.2, 5 · **Depends on:** — · **Blocks:** 2

## Goal

`docs/api/member.md` exists and is the thing the next two sprints are checked
against. The module exists with all six files. `GET .../members` is served from
it instead of from the workspace module, with a byte-identical response, and the
frontend does not notice.

## Tasks

### 1.1 Contract doc

- [x] `docs/api/member.md` per [api-contract-doc](../../skills/api-contract-doc/SKILL.md):
      header + route prefix, sibling-contract check against `auth.md`,
      `workspace.md` and `invitation.md` with every divergence numbered and
      justified, membership model, the role-change refusals, the last-owner
      guard, the removal cascade, rate limiting, caching, enumeration (including
      the residual oracle), guards, then all three endpoints numbered with body
      tables, envelope-complete JSON, and errors tables.
- [x] It documents endpoints 2 and 3 **before** they are built. That is the
      point: the decisions get made here, where they are cheap.

### 1.2 The six files

- [x] `member.dto.js` — `toMember(row)`, a whitelist. Moved from
      `workspace.dto.js#toWorkspaceMember` **with its comment header**: the
      `id`-is-the-membership / `userId`-is-the-person warning is the valuable
      part.
- [x] `member.validator.js` — `memberParamsSchema` (`workspaceId`, `memberId`,
      `.unknown(true)`) and `updateRoleSchema` (`role`, required,
      `valid(ADMIN, MEMBER)` — `OWNER` **absent from the list**, not rejected by
      a rule).
- [x] `member.repository.js` — `findMembers(workspaceId)`, moved from
      `workspace.repository.js#findWorkspaceMembers` with its header: the
      `select`-at-the-query argument and the enum-declaration-order note on
      `orderBy: [{ role: 'asc' }, { createdAt: 'asc' }]`. Plus
      `findMembershipById(id)` for sprint 2.
- [x] `member.service.js` — `listMembers(workspaceId)` and
      `findMemberOrThrow(workspaceId, memberId)`, which collapses *unknown id*
      and *id in another workspace* into one `404` (plan §6).
- [x] `member.controller.js` — `listMembers`, responding
      `ApiResponse.success(res, httpStatus.OK, 'Members fetched', { members })`.
      The message string is load-bearing; it is what ships today.
- [x] `member.routes.js` — `express.Router({ mergeParams: true })`,
      `GET /` with `authGuard` → `loadMembership` →
      `requirePermission(PERMISSIONS.MEMBER_VIEW)` → `asyncHandler`. No limiter
      on the read (plan §7).

### 1.3 Mount, and unmount the old one

- [x] `src/routes/index.js`: one line,
      `router.use("/api/v1/workspaces/:workspaceId/members", memberRoutes)`,
      alphabetical among the workspace-scoped mounts. Never in `app.js`.
- [x] Delete from the workspace module: the `/:workspaceId/members` route,
      `controller.listMembers`, `service.listMembers`,
      `repository.findWorkspaceMembers`, `dto.toWorkspaceMember` — and its
      export from the `dto` default object.
- [x] Grep for every remaining reference to `toWorkspaceMember` and
      `findWorkspaceMembers` before calling this done. A dangling import is a
      boot failure, not a test failure.
- [x] `docs/api/workspace.md`: add a short section where the roster used to be,
      pointing at `member.md`. It was never documented there; leaving silence
      behind makes the move look like a deletion.

### 1.4 Verify the move changed nothing

- [x] `GET /api/v1/workspaces/:id/members` as OWNER → `200`, same message, same
      array, same order (owner first).
- [x] As a plain `MEMBER` → `200`. As a non-member → `404`, not `403`.
- [x] No `user.passwordHash` or `user.emailVerifiedAt` anywhere in the response.
- [x] `frontend/src/lib/workspaces.ts#getWorkspaceMembers` is **not edited**. If
      it needs editing, the move was not byte-identical and the diff is wrong.
