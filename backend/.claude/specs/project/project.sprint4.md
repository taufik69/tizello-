# Sprint 4 — Collaborators: member CRUD, ownership transfer, verification

**Plan sections:** 2.4, 5, 8 · **Depends on:** 3 · **Blocks:** —

## Goal

A project owner or manager can decide who works on the project, ownership can
move without ever leaving the §2.4 invariant broken, and the whole module is
verified end to end against `docs/api/project.md`.

## Tasks

### 4.1 Repository — member operations

- [ ] `findProjectMembers(projectId, { page, limit })` — includes
      `user: { select: { id: true, name: true, email: true } }`, ordered
      `role` then `createdAt`. Never selects `passwordHash`.
- [ ] `addProjectMember(projectId, userId, role)`,
      `updateProjectMemberRole(projectId, userId, role)`,
      `removeProjectMember(projectId, userId)`.
- [ ] `transferOwnership(projectId, fromUserId, toUserId)` — **one
      transaction**: set `Project.ownerId = toUserId`, upsert the new owner's
      `ProjectMember` to `OWNER`, demote the old owner's row to `MANAGER`.
      Three writes, one commit; a partial apply is the invariant violation
      plan §2.4 exists to prevent.
- [ ] `findWorkspaceMembership(workspaceId, userId)` — or reuse Prisma
      directly in the service — for the "is this user even in the workspace"
      check in 4.2.

### 4.2 Service — member rules

- [ ] `addMember` — `422` when the target user has no `Membership` in the
      project's workspace (plan §8: a project member who cannot see the
      workspace is unreachable state). `409` on P2002 (already a member).
- [ ] `updateMemberRole` — **`409` when the target is the project owner.**
      Ownership moves through transfer only. The validator already blocks
      `role: OWNER` as an input; this blocks the owner as a *target*.
- [ ] `removeMember` — same `409` for the owner. Removing yourself as a plain
      member is allowed; removing yourself as owner is not.
- [ ] `transferOwnership` — `422` when the target is not a workspace member,
      `422` when the target is the current owner, then the transaction.
      Guarded by `requireProjectOwner` at the route, so no role check here.
- [ ] Every failure is an `AppError` with the right code; no `res` anywhere.

### 4.3 Controller + routes

- [ ] `listMembers`, `addMember`, `updateMemberRole`, `removeMember`,
      `transferOwnership` — all through `ApiResponse`; `201` on add, `200`
      elsewhere.
- [ ] Routes 7–11 from plan §5, all `apiLimiter`:
      - `GET /projects/:projectId/members` → `loadProject`
      - `POST /projects/:projectId/members` → + `requireProjectWrite`
      - `PATCH /projects/:projectId/members/:userId` → + `requireProjectWrite`
      - `DELETE /projects/:projectId/members/:userId` → + `requireProjectWrite`
      - `PATCH /projects/:projectId/transfer-ownership` → +
        `requireProjectOwner`
- [ ] Still six module files. No `projectMember.*.js`.

### 4.4 Sync and close out

- [ ] Update `docs/api/project.md`: sprint-4 endpoints move from "not yet
      implemented" to implemented, with the `409`/`422` cases from 4.2
      documented as behaviour, not as edge cases.
- [ ] Update `.claude/plan/project.md` with a §12 "Built" section recording
      anything that changed shape during implementation and why — the way
      `workspace.md` §9 does. If nothing changed, say that explicitly.
- [ ] Update this directory's `README.md` §Status with what was verified.

## Definition of done

Every check against a running server and the live database.

- [ ] `GET .../members` returns the OWNER row created back in sprint 2 —
      proof the §2.4 mirror row is actually being written.
- [ ] Add a workspace member as `COLLABORATOR` → `201`; adding them again →
      `409`; adding a user who is not in the workspace → `422`.
- [ ] Adding with `role: "OWNER"` → rejected by the validator.
- [ ] `PATCH .../members/:userId` promoting a COLLABORATOR to MANAGER →
      `200`, and that user can now `PATCH` the project.
- [ ] Targeting the **owner** with `PATCH .../members/:ownerId` or
      `DELETE .../members/:ownerId` → `409` both times.
- [ ] `DELETE .../members/:userId` → `200`; that user keeps read access
      (workspace member, plan §2.5 step 4) but loses write.
- [ ] Transfer: `ownerId` changes, the new owner's member row is `OWNER`, the
      old owner's is `MANAGER`, **all three in one commit** — verified by
      reading the rows, not by trusting the response.
- [ ] Transfer by a MANAGER → `403`. Transfer to a non-workspace-member →
      `422`. Transfer to the current owner → `422`.
- [ ] Full regression pass over sprints 2–3: create, list with every filter,
      get, update, archive, unarchive, delete, and the limiter.
- [ ] No response anywhere leaks `taskCounter`, `deletedAt`, or a user's
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
