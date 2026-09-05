# Auth & invitations — sprint breakdown

Nine sprints implementing [`.claude/plan/authentication.md`](../../plan/authentication.md).
The plan holds the **reasoning**; these files hold the **work**. When they
disagree, the plan wins — and gets updated to say why.

| Sprint | Delivers | Plan steps | Blocks |
|---|---|---|---|
| [1](./auth.sprint1.md) | Schema, migration, token utilities | 1–2 | everything |
| [2](./auth.sprint2.md) | Register, verify email, session, login, logout | 3–4 | 3, 4, 5 |
| [3](./auth.sprint3.md) | **Refresh rotation + reuse detection** | 5–6 | 4, 5 |
| [4](./auth.sprint4.md) | Login codes, forgot/reset password | 7–8 | — |
| [5](./auth.sprint5.md) | Google + GitHub OAuth (Passport) | 9–10 | — |
| [6](./auth.sprint6.md) | Redis rate limiters, `docs/api/auth.md` | 11–12 | — |
| [7](./auth.sprint7.md) | Invitations — admin side | 13–14 | 8 |
| [8](./auth.sprint8.md) | Invitations — recipient side + **deadlock fix** | 15–17 | 9 |
| [9](./auth.sprint9.md) | `docs/api/invitation.md`, frontend cutover | 18–19 | — |

## Rules that apply to every sprint

Non-negotiable, from the repo's own docs. A sprint is not done if it breaks one.

- **Six files per module** — controller, service, repository, routes, dto,
  validator. [module-consistency](../../skills/module-consistency/SKILL.md)
- **Controllers never call `res.json()`.** Everything goes through
  `ApiResponse`. [api-response](../../skills/api-response/SKILL.md)
- **Services throw `AppError`, never touch `res`.** Every async controller is
  wrapped in `asyncHandler`. [error-handling](../../rules/error-handling.md)
- **No `console.*`.** `createLogger('<tag>')` at module scope, `req.log` inside
  a request. [logging](../../rules/logging.md)
- **Multi-line comment header on every file**, recording the *why*.
  [code-comments](../../rules/code-comments.md)
- **Every error carries `data.code`** from the closed union the frontend maps to
  copy — plan §2.2. An error without a code is unrenderable on the frontend.
- **The contract doc is written alongside the code, not after.**
  [api-contract-doc](../../skills/api-contract-doc/SKILL.md)

## Order

1 → 2 → 3 must be sequential; each builds on the last.
4, 5, 6 are independent of one another once 3 lands.
7 → 8 → 9 must be sequential, and 8 needs 2 (registration exists to extend).

**Sprint 3 before sprint 4** is deliberate: rotation is the part most likely to
need rework, and every later flow issues tokens through it.

## The blocker that affects sprints 2, 4, 7 and 8

There is **no mail transport**. `src/workers/email.worker.js` has a `TODO` where
the send goes. Until it is wired, verification links, login codes and invitation
links are readable only in the worker log. Every sprint below that depends on
email says so in its Definition of Done.
