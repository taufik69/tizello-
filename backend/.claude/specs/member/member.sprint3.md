# Sprint 3 — Removal, the dev mail path, and verification

**Plan sections:** 2.5, 2.6, 2.7, 6 · **Depends on:** 2 · **Blocks:** —

## Goal

A member can be removed without leaving a trace of them on the workspace's
projects, a member who owns a project cannot be removed by accident, and the
invitation flow can be exercised end to end on a laptop with no SMTP
credentials.

## Tasks

### 3.1 Repository — removal

- [x] `findOwnedProjects(workspaceId, userId)` → `{ id, name, key }` for
      non-deleted projects where `ownerId === userId`.
- [x] `removeMember({ membershipId, workspaceId, userId })` — **one
      transaction**: delete the `Membership`, then
      `projectMember.deleteMany({ where: { userId, project: { workspaceId } } })`.
      Two statements, one commit; a partial apply is a user locked out of the
      workspace while still listed on its projects (plan §2.5).
- [x] The comment header records why this repository touches `Project` and
      `ProjectMember` at all — same divergence, same reason, as
      `invitation.repository.js` writing `Membership`.

### 3.2 Service — the refusals

- [x] `removeMember({ workspaceId, memberId, actorMembership })`.
- [x] `findMemberOrThrow` first → `404`.
- [x] `422` when the target's role is `OWNER` — *"A workspace owner cannot be
      removed. Transfer ownership first."*
- [x] `422` when the target is the caller — *"Use leave workspace to remove
      yourself."* Plan §8 q2: self-removal is a different operation with a
      different guard, and this `422` is what keeps that hole visible.
- [x] `422` on the last-owner count, same as sprint 2 and unreachable for the
      same reason.
- [x] `409 CONFLICT` when `findOwnedProjects` is non-empty, with
      `data.projects` carrying the list so the client can name them (plan §2.6).
- [x] Then the transaction.

### 3.3 Controller + route

- [x] `remove` → `ApiResponse.success(res, httpStatus.OK, 'Member removed',
      null)`. `200` with a null `data`, not `204`: the envelope is the house
      preference, and the invitation module's `204`s are a documented exception
      taken because a revoked invitation still has a row. There is none here.
- [x] `DELETE /:memberId` — `apiLimiter` → `authGuard` →
      `validate(memberParamsSchema, 'params')` → `loadMembership` →
      `requirePermission(PERMISSIONS.MEMBER_REMOVE)` → `asyncHandler`.

### 3.4 Dev without SMTP (plan §2.7)

- [x] `shared/utils/mailer.js`: when `!isMailConfigured()` and
      `config.nodeEnv !== 'production'`, `sendMail` logs `to`, `subject` and the
      link at `info` through the existing `createLogger('mailer')` and returns a
      stub info object without opening a transport. Production behaviour
      unchanged.
- [x] `workers/run-email-worker.js`: skip `verifyMailer()` in that same case and
      log one prominent line saying mail is in log-only mode. With
      `NODE_ENV=production` and no credentials, still exit 1.
- [x] The `CLIENT_ORIGIN !== '*'` check stays a hard failure in both modes — a
      link built from `*` is unclickable, and discovering that in dev is the
      point.
- [x] **No `console.*`.** `CLAUDE.md` forbids it; the one exception is
      `env.js`.
- [x] Update the mailer and worker comment headers to describe the two modes,
      and note the log-only mode in `docs/api/invitation.md` §*Files* or
      §*Tokens* — it changes how the invite link is obtained in development.

### 3.5 Verify

- [x] Remove a plain `MEMBER` as OWNER → `200`. Their `Membership` is gone, and
      so are their `ProjectMember` rows in that workspace's projects — and
      **only** in that workspace's projects.
- [x] Re-`DELETE` the same `memberId` → `404`. Not idempotent, deliberately.
- [x] Remove a member who owns a project → `409` naming the project. Nothing
      deleted.
- [x] Target is the owner → `422`. Target is yourself → `422`.
- [x] ADMIN removes a `MEMBER` → `200`. Plain `MEMBER` tries → `403`.
- [x] Removed user's next request to any project in that workspace → `404`
      (`project.js` step 1), proving the eviction is complete.
- [x] With no SMTP and `NODE_ENV=development`: start the worker, send an invite,
      read the accept link out of the worker log, `GET /invitations/:token` →
      `200`, accept → `200`, new member appears in the roster.
- [x] Full [module-consistency](../../skills/module-consistency/SKILL.md)
      new-module checklist: six files, `asyncHandler` everywhere, no `prisma`
      outside the repository, no `res` in the service, validator normalizes,
      routes wired in `routes/index.js`, `httpStatus` constants only, contract
      doc current.
- [x] `docs/api/member.md` matches the built code line for line. Anything that
      drifted gets fixed in the doc in this sprint, not later.
