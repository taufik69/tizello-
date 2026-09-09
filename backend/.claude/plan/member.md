# Plan — Member module

Naming note: the request called for a "Member + Invitation module" and steps 1,
3, 4 and 5 of a five-step build. **Four of the five already shipped** (§1).
What is left is the member-management half, and this plan is scoped to it:
`.claude/plan/member.md` + `.claude/specs/member/member.sprintN.md`, matching
auth / workspace / project.

---

## 1. What already exists — read this before §2

The request assumed a greenfield Member + Invitation module. The repo is further
along than that, and the gap is narrower and differently shaped than the five
steps describe.

| Requested step | Status | Where |
|---|---|---|
| 1 — `Invitation` model + migration | **Done**, with three deliberate divergences (§2.1) | `prisma/schema.prisma`, `prisma/migrations/20260906000000_auth_and_invitations/` |
| 2 — Member module: invite / list members / list invites / change role / remove / cancel / resend | **Partly.** Invite, list invites, cancel, resend: done, in the invitation module. List members: done, in the **wrong** module. **Change role and remove: missing.** | `src/modules/invitation/`, `workspace.controller.js#listMembers` |
| 3 — Accept flow | **Done**, plus decline and a register-time apply path the request did not ask for | `invitation.service.js#acceptInvitation`, `#declineInvitation`, `#applyInviteTokenOnRegister` |
| 4 — BullMQ invitation email | **Done** except the dev-without-SMTP path (§2.7) | `queues/email.queue.js#enqueueInvitationEmail`, `workers/email.worker.js` |
| 5 — Contract doc | **Done** for invitations (507 lines). `docs/api/member.md` is new, written in sprint 1 | `docs/api/invitation.md`, `docs/api/member.md` |

Reusable, unchanged:

- **`shared/constants/roles.js`** — `Role`, `ROLE_ORDER`, and a permission table
  that already contains `member:view`, `member:invite`, `member:remove`,
  `member:role:update`. This module adds **no** new permissions; it is the first
  consumer of the last two.
- **`shared/middlewares/permission.js`** — `loadMembership`,
  `requirePermission`. Workspace-scoped by construction, which is why every
  route here carries `:workspaceId` in the path (§5).
- **`shared/middlewares/project.js`** — step 1 of the ladder is *no workspace
  membership → 404*. This is what makes deleting a `Membership` a complete
  eviction from every project in the workspace (§2.5).
- **Invitation module end to end** — nothing in this plan touches it. A person
  becomes a member by accepting an invitation, and that path is finished.

### The one thing that does *not* exist and is not built here

There is no `POST /members`. Adding a member directly would take a `userId` the
caller has no way to obtain without a user-lookup-by-email endpoint — an
account-enumeration oracle built to serve a feature nobody asked for — and it
would put somebody in a workspace without their consent. The invitation is the
only door. Recorded here because its absence is a decision, not an oversight.

---

## 2. Design decisions

### 2.1 The `Invitation` schema is adopted as-built. No migration.

The requested model and the shipped one differ on three points. The shipped one
wins on all three, and the reasoning is already in the schema comments:

| # | Requested | Shipped | Why the shipped one stands |
|---|---|---|---|
| 1 | `token String @unique` | `tokenHash String @unique` (SHA-256) | A leaked dump of raw invitation tokens *is* a set of working links into every workspace. A dump of hashes is not. The raw value exists only in the email and in the job payload that sent it — which is why `enqueueInvitationEmail` takes the token as an argument rather than letting the worker read it off the row. |
| 2 | `status` enum `PENDING/ACCEPTED/EXPIRED/CANCELLED` | Four nullable timestamps — `acceptedAt`, `declinedAt`, `revokedAt`, `expiresAt` — with status **derived** in `invitation.dto.js#statusOf` | A stored status is a second source of truth that drifts the moment one write path forgets it. The timestamps answer *when*, which is what an audit needs and a status column cannot reconstruct. The derivation order is documented and is itself the contract: a row can be revoked **and** expired at once. |
| 3 | `Member` model, `WorkspaceRole` enum | `Membership` model, `Role` enum | Already the names in the schema, the permission middleware, the workspace module, the project module and both contract docs. Renaming them is a migration plus five modules to serve a naming preference. |

Requested and already present: `id`, `email`, `workspaceId` relation,
`role Role @default(MEMBER)`, `invitedById`, `expiresAt`, `createdAt`,
`@@index([email])`, reverse relations on `Workspace` (`invitations`) and `User`
(`sentInvitations`, `acceptedInvitations` — two, because the inviter and the
acceptor are different people on the same row).

The "don't duplicate a pending invite" rule is enforced **twice**: `findLive`
produces a friendly `409 INVITE_PENDING`, and the partial unique index
`invitations_live_email_workspace` (hand-written into the migration — Prisma
cannot express a partial index) stops two admins racing. Resend **rotates the
token** rather than replacing the row, so the link the admin thought they
replaced stops working.

**Net: zero schema changes, zero migrations, in this entire plan.** Every
endpoint below reads and writes tables that already exist.

### 2.2 The roster read moves into this module, unchanged

`GET /api/v1/workspaces/:workspaceId/members` is live today as
`workspace.controller.listMembers` — and undocumented: `docs/api/workspace.md`
has no section for it.

It moves here. Path, status, message (`"Members fetched"`) and body
(`{ members: [...] }`) are byte-identical, so
`frontend/src/lib/workspaces.ts#getWorkspaceMembers` is untouched. This is a
move, not a change.

Why move it at all: the roster's **writes** live here, and a resource whose read
is in one module and whose writes are in another has two owners and therefore
none. The next person to add a field to a roster row would have to find both.

What moves with it: `workspace.repository.js#findWorkspaceMembers` and
`workspace.dto.js#toWorkspaceMember`, including their comment headers — the
`select`-at-the-query argument and the `id`-vs-`userId` warning are the valuable
part and must not be left behind.

### 2.3 Role changes: three refusals, and they are about state, not shape

| Refused | Status | Why |
|---|---|---|
| `role: "OWNER"` | `422` | *Ownership is transferred, never granted* — the same rule `invitation.validator.js` enforces by omitting `OWNER` from its `valid()` list. Enforced here the same way (closed list, not a rejection rule: a closed list cannot be widened by a typo) **and re-checked in the service**, because a validator only protects callers arriving over HTTP. |
| Target is the `OWNER` | `422` | This is the demotion half of an ownership transfer, reachable on its own. Allowed, it is precisely how a workspace reaches zero owners. |
| Target is the caller | `422` | Self-demotion is the one role change nobody can undo: an `ADMIN` who drops to `MEMBER` loses the permission to climb back, and recovery means another admin or the database. |

`422`, not `400`, for all three: the request is well-formed and each value is
individually legal — it is the *state* that forbids it. Same distinction
`invitation.md` draws when it answers `422` to `role: "OWNER"`.

### 2.4 The last-owner guard is redundant today and is written anyway

Before any write that could reduce the `OWNER` count, the service counts owner
memberships in the workspace and refuses if the target is the last one.

§2.3 already makes an `OWNER`'s role unchangeable and §2.5 makes them
unremovable, so the count cannot reach zero by either path. The guard is still
written, and tested, because **it is the invariant** — the other two rules are
merely where it currently bites. The moment ownership transfer or leave-workspace
lands (§7), those two stop covering every path, and this is the only thing
between a typo and a workspace nobody can administer: no one can delete it, bill
it, or change a role in it, because each needs a permission only `OWNER` holds.

A redundant check on an unrecoverable state is the cheapest line in the module.

### 2.5 Removal cascade — the half that is easy to miss

Deleting a `Membership` evicts the user from every project in the workspace
immediately, because `project.js` step 1 is *no workspace membership → 404*. It
does **not** delete their `ProjectMember` rows: those cascade from `Project` and
`User`, not from `Membership`.

Left alone, a removed person keeps appearing in every project member panel and
every assignee picker — present in the UI, refused by the API. So removal
deletes them too, **in the same transaction**, scoped to that workspace's
projects.

This is why `member.repository.js` reads `Project` and writes `ProjectMember`,
tables the project module owns. The house rule is *one repository per module*,
not one table per module — the same divergence, for the same reason, as
`invitation.repository.js` writing `Membership` rows.

### 2.6 A member who owns a project cannot be removed — `409`

`Project.ownerId` is `onDelete: Restrict` precisely so that losing a user never
silently orphans projects. Removing someone from the workspace is the same loss
by a different route, so it gets the same answer: refuse, and name the projects
in `data.projects` so the client can say *"transfer these three first"* instead
of *"something went wrong"*.

Auto-reassigning the projects to the actor was the alternative and is worse: it
makes an irreversible ownership change a silent side effect of a destructive
action the caller thought they understood.

### 2.7 Dev without SMTP — the gap in step 4

`run-email-worker.js` calls `verifyMailer()` at boot, which **throws** when
`HOST_MAIL` / `HOST_APP_PASSWORD` are unset, and the process exits 1. That is
right for production — a worker that cannot send is worse than one that refuses
to start, because it drains the queue into failed jobs while looking healthy —
but it means there is no dev path at all: with no SMTP, no invitation email is
ever attempted, so the accept flow cannot be exercised locally.

Fix, in `mailer.js` + `run-email-worker.js`:

- `isMailConfigured()` already exists and is already exported. When it is false
  **and** `config.nodeEnv !== 'production'`, `sendMail` logs the message —
  recipient, subject, and the link — at `info` through `createLogger('mailer')`
  and returns a stub info object instead of opening a transport.
- `run-email-worker.js` skips `verifyMailer()` in that same case and logs one
  prominent line saying mail is in log-only mode. In production, unchanged:
  missing credentials still exit 1.
- **`console.*` is not an option** — `CLAUDE.md` forbids it outright, and the
  one exception is `env.js`. The dev-OTP precedent in auth is the same: the code
  reaches the developer through the logger.
- The `CLIENT_ORIGIN !== '*'` check stays a hard failure in both modes. A link
  built from `*` is unclickable, and discovering that in dev is the point.

This is the only change in the plan outside `src/modules/member/`, and it is the
only one that touches a file the invitation module depends on.

---

## 3. Schema — final shape

**No change.** `Membership`, `Invitation`, `Role` and the partial unique index
are all as shipped (§2.1). No migration is generated by any sprint in this plan.

Recorded explicitly because "the member module" sounds like it needs a `Member`
table, and the answer is that `Membership` has been that table since the init
migration.

---

## 4. Permissions — no new entries

`shared/constants/roles.js` already declares everything this module checks:

| Permission | OWNER | ADMIN | MEMBER | First used by |
|---|---|---|---|---|
| `member:view` | ✅ | ✅ | ✅ | already used — invitation list, roster |
| `member:remove` | ✅ | ✅ | — | **this module** |
| `member:role:update` | ✅ | — | — | **this module** |

`member:role:update` being OWNER-only is deliberate in that file (*"it makes the
OWNER-only rows — delete the workspace, change roles, billing — obvious at a
glance"*), and it **contradicts the request**, which said OWNER/ADMIN. It also
contradicts the frontend fixture `demo-permissions.ts`, which grants
`members.roles` to `ADMIN`. See §8 question 1 — this is the one decision that
blocks sprint 2.

---

## 5. Endpoint contract

Full contract, with every error and its reasoning, is `docs/api/member.md`. The
summary:

| # | Method + path | Guard | Sprint |
|---|---|---|---|
| 1 | `GET /api/v1/workspaces/:workspaceId/members` | `member:view` | 1 (moved) |
| 2 | `PATCH /api/v1/workspaces/:workspaceId/members/:memberId` | `member:role:update` | 2 |
| 3 | `DELETE /api/v1/workspaces/:workspaceId/members/:memberId` | `member:remove` | 3 |

All three: `authGuard` → `loadMembership` → `requirePermission`, on a router
with `mergeParams: true`. Without `mergeParams` `req.params.workspaceId` is
undefined inside the sub-router, `loadMembership` cannot resolve a membership,
and every request `400`s on a workspace id that is visibly right there in the
URL — the trap `invitation.routes.js` already documents.

`:memberId` is `Membership.id`, not `userId`. A membership belongs to exactly
one workspace, so a `(workspaceId, memberId)` mismatch is detectable; a global
`userId` from another workspace would be a question this module cannot answer
safely.

Pending invitations stay at `GET /api/v1/workspaces/:workspaceId/invitations`.
The members screen makes two calls and renders two lists — a pending invite has
no `userId`, a different `createdAt`, and a status, so folding it into the roster
array would make every consumer branch on a half-populated row.

---

## 6. Failure modes

| Condition | Behaviour | Why |
|---|---|---|
| `:memberId` unknown **or** in another workspace | `404`, identical | Answering `403` on the second confirms to an admin of workspace A that a membership id is live in workspace B — a membership-existence oracle across a trust boundary. Same argument `loadMembership` makes for `404`-ing a non-member. |
| Caller not a member of `:workspaceId` | `404` from `loadMembership` | Confirming a workspace exists to someone with no access is itself the leak. |
| Role set to the value already held | `200`, no-op, full row returned | Idempotent. Reporting failure for a state the caller asked for and got is wrong. |
| Second `DELETE` on the same `:memberId` | `404` — **not idempotent** | A membership id is not a stable handle for a person; it is gone, and the next invitation mints a new one. Opposite call from invitation accept, because the asymmetry runs the other way: reporting success for a removal that did not happen tells an admin someone is out when they are not. |
| Removal transaction fails midway | Nothing committed | `Membership` delete and `ProjectMember` cleanup are one transaction (§2.5). A partial apply is a user locked out of the workspace while still listed on its projects. |
| Redis unreachable | `429`, fail **closed** | `failClosed` in `rateLimiter.js`, identical to every sibling. |
| Role demotion timing | Takes effect on the member's **next request** | Roles are read per request by `loadMembership`, never cached and never in the access token. A role in a JWT is a role that stays true for fifteen minutes after it stops being true. |

---

## 7. Rate limiting

| Route | Limiter | Why |
|---|---|---|
| `GET` | none | An authenticated read of a bounded list, already behind `loadMembership`. Matches every authenticated read in `workspace.routes.js`. |
| `PATCH`, `DELETE` | `apiLimiter` (15m / 100, IP) | Not a brute-force surface — both need a valid membership id *and* a permission. `invitation.routes.js` puts `apiLimiter` on revoke for the same reason. A bespoke limiter here would imply a threat that does not exist. |

No new limiter is added.

---

## 8. Open questions

1. **Who may change a role — `OWNER`, or `OWNER` and `ADMIN`?** **Blocks sprint
   2.** The request said OWNER/ADMIN; `roles.js` says OWNER only and says so
   deliberately; `frontend/src/lib/demo-permissions.ts` says both. One of the
   three has to move.

   Recommendation: **keep the backend OWNER-only and fix the fixture.** An
   `ADMIN` who can grant `ADMIN` can mint peers at will, and since an `ADMIN`
   also holds `member:remove`, that pair is enough to reshape a workspace's
   administration without its owner. The cost is real and narrow: a workspace
   whose only owner is away cannot promote anyone.

   If it moves instead, it is one line in `ROLE_PERMISSIONS` plus a new service
   rule — *an `ADMIN` may not change another `ADMIN`'s role* — because without
   it two admins can demote each other and the last writer wins.
2. **`DELETE .../members/me` — leave workspace.** Not in the request, not built.
   Any member may leave, so the guard is membership rather than `member:remove`
   (an `ADMIN` removing themselves is leaving, and putting a `MEMBER`'s exit
   behind a permission they do not hold is wrong). The `OWNER` may not leave —
   same invariant as §2.4. The `422` on self-removal in endpoint 3 is what keeps
   this hole visible instead of letting `DELETE :memberId` quietly double as it.
3. **Ownership transfer.** `PATCH .../members/:memberId/transfer-ownership`,
   atomically promoting the target and demoting the caller. Three of this
   module's `422`s exist only because it does not.
4. **Peer protection between admins on `DELETE`.** An `ADMIN` can remove another
   `ADMIN`. Defensible — trusted equals — and also how a rogue admin clears the
   deck. Left unresolved on purpose; it belongs with question 1, because
   granting `ADMIN` the role-change permission is what makes it urgent.
5. **`MEMBER` sees every member's email.** The roster returns addresses to every
   member, plain `MEMBER` included. That is the feature, and it is bounded by
   membership, which is bounded by an invitation somebody with `member:invite`
   sent. Recorded so the next reader weighing it knows it was decided.

---

## 9. Build order

Sprints in `.claude/specs/member/README.md`. Sequential:

contract doc + six files + roster move + mount (1) →
`PATCH` role + the three refusals + last-owner guard (2) →
`DELETE` + removal transaction + project-ownership `409` + dev-SMTP fallback +
verification (3).

Sprint 2 is blocked on §8 question 1.
