# Project — sprint breakdown

Four sprints implementing [`.claude/plan/project.md`](../../plan/project.md).
The plan holds the **reasoning**; these files hold the **work**. When they
disagree, the plan wins — and gets updated to say why.

| Sprint | Delivers | Blocks |
|---|---|---|
| [1](./project.sprint1.md) | Schema + migration, PROJECT_* permissions, key util, validator, dto | 2 |
| [2](./project.sprint2.md) | Repository, `loadProject` middleware, service, create/list/get, both mounts | 3 |
| [3](./project.sprint3.md) | Update / archive / delete, `projectCreateLimiter`, `docs/api/project.md` | 4 |
| [4](./project.sprint4.md) | ProjectMember CRUD, ownership transfer, full verification | — |

## Rules that apply to every sprint

Non-negotiable, from the repo's own docs. A sprint is not done if it breaks one.

- **Six files per module** — controller, service, repository, routes, dto,
  validator. Member endpoints go in those same six files, not a second module.
  [module-consistency](../../skills/module-consistency/SKILL.md)
- **Controllers never call `res.json()`.** Everything goes through
  `ApiResponse`. [api-response](../../skills/api-response/SKILL.md)
- **Services throw `AppError`, never touch `res`.** Every async controller is
  wrapped in `asyncHandler`. [error-handling](../../rules/error-handling.md)
- **No `console.*`.** `createLogger('<tag>')` at module scope, `req.log`
  inside a request. [logging](../../rules/logging.md)
- **Multi-line comment header on every file**, recording the *why*.
  [code-comments](../../rules/code-comments.md)
- **Authorization is middleware, never a service `if`.** The two-layer ladder
  is plan §2.5, implemented once in `shared/middlewares/project.js`.
- **`ownerId` is the only authorization read for ownership** (plan §2.4). No
  service anywhere checks `ProjectMember.role === 'OWNER'`.
- **`taskCounter` is written by nobody** in this module (plan §2.3) and never
  appears in a DTO.
- **No `Sprint` or `Task` stub models.** They land with their own modules
  (plan §2.1 correction 5).
- **The contract doc is written in sprint 3, then kept in sync.** After that,
  changing a status code, guard, limiter, or validation rule means editing
  `docs/api/project.md` in the same commit — not after.

## Order

Strictly sequential: 1 → 2 → 3 → 4. Sprint 4's member endpoints depend on the
`loadProject` middleware from 2 and the write-path conventions from 3.
