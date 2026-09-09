# Sprint 2 — Role changes

**Plan sections:** 2.3, 2.4, 4, 6 · **Depends on:** 1 · **Blocks:** 3

**Blocked on plan §8 question 1** — whether `member:role:update` stays
OWNER-only, or moves to OWNER + ADMIN (one line in `ROLE_PERMISSIONS`, plus an
*ADMIN may not change another ADMIN's role* rule in 2.2). Do not start until
that is answered; the guard table in the contract doc changes with it.

## Goal

A role can be changed, and the four states that must never be reachable are not
reachable — including the one that is currently unreachable anyway.

## Tasks

### 2.1 Repository

- [x] `updateRole(membershipId, role)` → the updated row including
      `user: { select: { id, name, email } }`, so the response is a full roster
      row and the client can replace one row in place instead of refetching.
- [x] `countOwners(workspaceId)` — `membership.count({ where: { workspaceId,
      role: 'OWNER' } })`.

### 2.2 Service — the refusals

- [x] `changeRole({ workspaceId, memberId, role, actorMembership })`.
- [x] `findMemberOrThrow` first: `404` before any state check, so an unknown id
      never reveals which rule it would have hit.
- [x] `422` when `role === ROLES.OWNER`. Duplicates the validator on purpose —
      a validator only protects callers arriving over HTTP, and an endpoint that
      can mint an OWNER is a privilege-escalation endpoint.
- [x] `422` when the target's role is `OWNER` — *"A workspace owner's role is
      changed by transferring ownership, not here."*
- [x] `422` when `target.id === actorMembership.id` — *"You cannot change your
      own role."*
- [x] `422` when `countOwners(workspaceId) <= 1 && target.role === OWNER`. Plan
      §2.4: unreachable today, written because it is the invariant. A comment
      saying exactly that, so nobody deletes it as dead code.
- [x] Same role as already held → no-op, return the row. Idempotent.
- [x] Every throw is an `AppError` with an `AUTH_CODES` code. No `res`, no
      `prisma`.

### 2.3 Controller + route

- [x] `updateRole` → `ApiResponse.success(res, httpStatus.OK,
      'Member role updated', { member })`.
- [x] `PATCH /:memberId` — `apiLimiter` → `authGuard` →
      `validate(memberParamsSchema, 'params')` → `loadMembership` →
      `requirePermission(PERMISSIONS.MEMBER_ROLE_UPDATE)` →
      `validate(updateRoleSchema)` → `asyncHandler`. Limiter first, payload
      validation last — a caller who may not act here is refused before their
      body is parsed, matching `invitation.routes.js`.

### 2.4 Verify

- [x] OWNER promotes a `MEMBER` to `ADMIN` → `200`, full row, new role.
- [x] The promoted member's next request is authorized at the new role — proves
      the role is read per request and is not in the token.
- [x] `role: "OWNER"` → `400` at the validator. Calling the service directly
      with it → `422`.
- [x] Target is the owner → `422`. Target is yourself → `422`.
- [x] `memberId` from another workspace → `404`, byte-identical to a
      nonexistent id.
- [x] ADMIN caller → `403` (or `200`, if §8 q1 moved the permission — then also:
      ADMIN changing another ADMIN → `422`).
- [x] `docs/api/member.md` §2 still matches, including every row of the errors
      table.
