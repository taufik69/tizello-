# Sprint 4 — Collaborators: member CRUD, ownership transfer, verification

**Plan sections:** 2.4, 5, 8 · **Depends on:** 3 · **Blocks:** —

## Goal

A project owner or manager can decide who works on the project, ownership can
move without ever leaving the §2.4 invariant broken, and the whole module is
verified end to end against `docs/api/project.md`.

## Tasks

### 4.1 Repository — member operations

- [x] `findProjectMembers(projectId, { page, limit })` — includes
      `user: { select: { id: true, name: true, email: true } }`, ordered
      `role` then `createdAt`. Never selects `passwordHash`.
- [x] `addProjectMember(projectId, userId, role)`,
      `updateProjectMemberRole(projectId, userId, role)`,
      `removeProjectMember(projectId, userId)`.
- [x] `transferOwnership(projectId, fromUserId, toUserId)` — **one
      transaction**: set `Project.ownerId = toUserId`, upsert the new owner's
      `ProjectMember` to `OWNER`, demote the old owner's row to `MANAGER`.
      Three writes, one commit; a partial apply is the invariant violation
      plan §2.4 exists to prevent.
- [x] `findWorkspaceMembership(workspaceId, userId)` — or reuse Prisma
      directly in the service — for the "is this user even in the workspace"
      check in 4.2.

### 4.2 Service — member rules

- [x] `addMember` — `422` when the target user has no `Membership` in the
      project's workspace (plan §8: a project member who cannot see the
      workspace is unreachable state). `409` on P2002 (already a member).
- [x] `updateMemberRole` — **`409` when the target is the project owner.**
      Ownership moves through transfer only. The validator already blocks
      `role: OWNER` as an input; this blocks the owner as a *target*.
- [x] `removeMember` — same `409` for the owner. Removing yourself as a plain
      member is allowed; removing yourself as owner is not.
- [x] `transferOwnership` — `422` when the target is not a workspace member,
      `422` when the target is the current owner, then the transaction.
      Guarded by `requireProjectOwner` at the route, so no role check here.
- [x] Every failure is an `AppError` with the right code; no `res` anywhere.

### 4.3 Controller + routes

- [x] `listMembers`, `addMember`, `updateMemberRole`, `removeMember`,
      `transferOwnership` — all through `ApiResponse`; `201` on add, `200`
      elsewhere.
- [x] Routes 7–11 from plan §5, all `apiLimiter`:
      - `GET /projects/:projectId/members` → `loadProject`
      - `POST /projects/:projectId/members` → + `requireProjectWrite`
      - `PATCH /projects/:projectId/members/:userId` → + `requireProjectWrite`
      - `DELETE /projects/:projectId/members/:userId` → + `requireProjectWrite`
      - `PATCH /projects/:projectId/transfer-ownership` → +
        `requireProjectOwner`
- [x] Still six module files. No `projectMember.*.js`.

### 4.4 Sync and close out

- [x] Update `docs/api/project.md`: sprint-4 endpoints move from "not yet
      implemented" to implemented, with the `409`/`422` cases from 4.2
      documented as behaviour, not as edge cases.
- [x] Update `.claude/plan/project.md` with a §12 "Built" section recording
      anything that changed shape during implementation and why — the way
      `workspace.md` §9 does. If nothing changed, say that explicitly.
- [x] Update this directory's `README.md` §Status with what was verified.

## Definition of done

Every check against a running server and the live database.

- [x] `GET .../members` returns the OWNER row created back in sprint 2 —
      proof the §2.4 mirror row is actually being written.
- [x] Add a workspace member as `COLLABORATOR` → `201`; adding them again →
      `409`; adding a user who is not in the workspace → `422`.
- [x] Adding with `role: "OWNER"` → rejected by the validator.
- [x] `PATCH .../members/:userId` promoting a COLLABORATOR to MANAGER →
      `200`, and that user can now `PATCH` the project.
- [x] Targeting the **owner** with `PATCH .../members/:ownerId` or
      `DELETE .../members/:ownerId` → `409` both times.
- [x] `DELETE .../members/:userId` → `200`; that user keeps read access
      (workspace member, plan §2.5 step 4) but loses write.
- [x] Transfer: `ownerId` changes, the new owner's member row is `OWNER`, the
      old owner's is `MANAGER`, **all three in one commit** — verified by
      reading the rows, not by trusting the response.
- [x] Transfer by a MANAGER → `403`. Transfer to a non-workspace-member →
      `422`. Transfer to the current owner → `422`.
- [x] Full regression pass over sprints 2–3: create, list with every filter,
      get, update, archive, unarchive, delete, and the limiter.
- [x] No response anywhere leaks `taskCounter`, `deletedAt`, or a user's
      `passwordHash` / `emailVerifiedAt`.

## Traps

- Do not implement transfer as two separate updates. The window between them
  is a project with an `ownerId` that has no `OWNER` member row.
- Do not let `updateMemberRole` become a second path to ownership. One write
  path, plan §2.4.
- Do not let the member list select the full `User` row. Whitelist the three
  fields; `auth.dto.js` is the precedent.
- Do not skip the "old owner becomes MANAGER" half of transfer — an ex-owner
  silently dropping to no access is a support ticket, not a feature.
- Do not close the module out without updating the contract doc and the plan.
  Both are checklist items above precisely because they are the ones that get
  skipped.

## Status — built

All five sections shipped and verified against the running server and the live
database, with the same six identities sprint 3 used.

- `GET .../members` immediately after create returns exactly one row,
  `OWNER` — the §2.4 mirror row is really being written by the create
  transaction, not assumed.
- Add a workspace member as `COLLABORATOR` → `201`; again → `409`; a user who
  is not in the workspace → `422`; `role: "OWNER"` → `400` from the validator;
  a `COLLABORATOR` attempting the add → `403`.
- Roster returns owner-first (`OWNER`, `MANAGER`, `COLLABORATOR`) and the
  nested `user` carries exactly `id, name, email` — swept, nothing else.
- Promote `COLLABORATOR` → `MANAGER`: they could not `PATCH` the project
  before and could after. Demote and remove: they keep read access as a
  workspace member (`viewerRole: null`) and lose write (`403`).
- Targeting the **owner** with `PATCH .../members/:ownerId` or
  `DELETE .../members/:ownerId` → `409` both times. A `:userId` who is on no
  project row → `404`.
- Transfer: `MANAGER` → `403`, non-workspace target → `422`, current owner →
  `422`, owner → `200`. Verified by reading the rows, not the response:
  `ownerId` moved, the new owner's row is `OWNER`, the old owner's is
  `MANAGER`, and the invariant check "ownerId has a matching OWNER member row"
  is true.
- Regression over sprints 2–3: list (workspace, `q`), get, patch, archive
  (`status` untouched), unarchive, delete, and the `404` for a stranger. No
  response anywhere carried `taskCounter`, `deletedAt`, or a user field beyond
  the three whitelisted.
- `docs/api/project.md` §§7–11 rewritten from "not yet implemented" to the
  built behaviour, with the `409`/`422` cases documented as behaviour.

### The limiter cap, deferred from sprint 3

`projectCreateLimiter` confirmed at **30 per hour**. The limiter is first in
the middleware chain, so an invalid body still consumes budget and writes
nothing — 34 such requests were sent and the status flipped from `400` to
`429` on the 28th, the earlier three having been spent by the real creates
across sprints 2–4. A subsequent valid create also returned `429`.

`failClosed` itself was not re-proved by stopping Redis: it is shared,
unchanged, already exercised by the workspace module, and taking the dev Redis
down would have stopped the whole environment to test a property no line of
this module touches.

### Deviations from the sprint text

1. **`updateMemberRole` and `removeMember` 404 on a non-member target.** The
   sprint listed only the `409`-on-owner case. Without the existence check,
   Prisma's `P2025` on a missing row surfaces through the global handler's
   mapping rather than as this module's own message — same status, worse
   sentence. The check is explicit.
2. **`listMembers` defaults to `limit: 50`, not 20.** A roster is read whole
   far more often than a project list is, and 20 forces a second request on an
   ordinary team.
3. **One check in the final regression was mislabelled while running, not
   wrong.** "New owner can delete, old owner cannot" returned `200` for the
   old owner — correct, because that identity is also the *workspace* OWNER
   and holds `PROJECT_MANAGE_ANY` (the §2.5 escape hatch). The MANAGER-cannot-
   delete case was already proved in sprint 3 with a workspace MEMBER who
   holds no escape hatch.
