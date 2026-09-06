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

## Status — all nine sprints are built

Every sprint in the table above is implemented and its Definition of Done
verified against a running server and the live database. The two contract docs
exist: [`docs/api/auth.md`](../../../docs/api/auth.md) and
[`docs/api/invitation.md`](../../../docs/api/invitation.md).

Three decisions changed during implementation. Each is recorded in
[`.claude/plan/authentication.md`](../../plan/authentication.md) §13 and in the
section it contradicts, not only here:

1. **`/logout` identifies the session from a `fid` claim on the access token**,
   not from the refresh cookie — which its `path` scoping means the browser never
   sends to `/logout`. Plan §4.4.
2. **The OAuth routes are `/api/v1/auth/<provider>/(start|callback)`** — no
   `/oauth` segment, because the provider consoles pin the path. Plan §9.
3. **Rate-limit keys collapse IPv6 to its subnet** via `ipKeyGenerator`. Sprint 6
   §6.2 specified IP + email; without the subnet collapse an IPv6 client takes a
   fresh /128 per request and every limit becomes advisory.

## The one remaining blocker — operational, not architectural

The mail transport is wired: Nodemailer over SMTP in
`src/shared/utils/mailer.js`, all four job types handled in
`src/workers/email.worker.js`, and the worker verifies the transport at startup
rather than discovering it is broken on the first real send.

**The Gmail App Password in `.env` is rejected** — `534 5.7.9 WebLoginRequired`,
which means Google is treating it as an ordinary account password, so the App
Password has been revoked or 2-Step Verification is off on the sending account.
Regenerate it; no code change is needed. Until then, verification links, login
codes and invitation links are readable from the BullMQ job payloads, which is
how every sprint above was tested.
