# Member — sprint breakdown

Three sprints implementing [`.claude/plan/member.md`](../../plan/member.md). The
plan holds the **reasoning**; these files hold the **work**. When they disagree,
the plan wins — and gets updated to say why.

| Sprint | Delivers | Blocks |
|---|---|---|
| [1](./member.sprint1.md) | `docs/api/member.md`, six module files, roster read moved out of the workspace module, mount | 2 |
| [2](./member.sprint2.md) | `PATCH .../members/:memberId` — the three refusals and the last-owner guard | 3 |
| [3](./member.sprint3.md) | `DELETE .../members/:memberId` + removal transaction + project-ownership `409`, dev-without-SMTP fallback, verification | — |

**Sprint 2 is blocked on plan §8 question 1** — whether `member:role:update`
stays OWNER-only. Sprint 1 does not touch it and can start immediately.

## Rules that apply to every sprint

Non-negotiable, from the repo's own docs. A sprint is not done if it breaks one.

- **Six files per module** — controller, service, repository, routes, dto,
  validator. No seventh file, no `member-role.*.js`.
  [module-consistency](../../skills/module-consistency/SKILL.md)
- **Controllers never call `res.json()`.** Everything through `ApiResponse`;
  status codes from `httpStatus`, never a bare integer.
  [api-response](../../skills/api-response/SKILL.md)
- **Services throw `AppError` with an `AUTH_CODES` code**, never touch `res`,
  never import `prisma`. Every async controller wrapped in `asyncHandler`, no
  `try/catch` in a controller. [error-handling](../../rules/error-handling.md)
- **No `console.*`.** `createLogger('<tag>')` at module scope, `req.log` inside
  a request — including the dev mail fallback in sprint 3.
  [logging](../../rules/logging.md)
- **Multi-line comment header on every file**, recording the *why* and pointing
  at `docs/api/member.md`. [code-comments](../../rules/code-comments.md)
- **Authorization is middleware, never a service `if` on a role string.**
  `authGuard` → `loadMembership` → `requirePermission(PERMISSIONS.X)`. The
  service's guards are about *state* (who the target is), never about capability.
- **No schema change, no migration, in any sprint** (plan §3). A sprint that
  generates one has misread the plan.
- **Nothing in `src/modules/invitation/` is edited.** The invitation half is
  finished; this module cross-references it.
- **`docs/api/member.md` is written in sprint 1, then kept in sync.** After
  that, changing a status code, guard, limiter or validation rule means editing
  the doc in the same commit — not after.

## Order

Strictly sequential: 1 → 2 → 3. Sprint 2 needs sprint 1's repository and the
`findMemberOrThrow` lookup; sprint 3 needs sprint 2's guard helpers.
