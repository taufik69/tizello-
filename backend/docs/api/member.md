# `member` — API contract

**Module:** `src/modules/member/` · **Route prefix:**
`/api/v1/workspaces/:workspaceId/members`

> **Sibling-contract check.** Response envelope, `AppError` shape,
> validation-error shape, guard middleware names and rate-limiter precedent all
> match [auth.md](./auth.md), [workspace.md](./workspace.md) and
> [invitation.md](./invitation.md): `{ success, statusCode, message, data }` from
> `ApiResponse`, services throwing `AppError` carrying a `data.code` from
> `AUTH_CODES`, `validate` producing `400` with a per-field `details` array, and
> `authGuard` → `loadMembership` → `requirePermission` from `shared/middlewares/`.
>
> **Deliberate divergences, five of them:**
>
> 1. **This module does not own an invitation endpoint, and a reader looking for
>    "add a member" will not find one here.** There is no `POST /members`: the
>    only way into a workspace is an invitation the recipient accepts, which
>    lives in [invitation.md](./invitation.md) §1 and §6. A `POST /members`
>    taking a `userId` would be a way to put somebody in a workspace without
>    their consent, and it would need a user-lookup-by-email endpoint to be
>    usable — an account-enumeration oracle built to serve a feature nobody
>    asked for. **Pending invitations are listed by
>    `GET /api/v1/workspaces/:workspaceId/invitations`**, not by anything here.
> 2. **`GET .../members` moved out of the workspace module** (it was
>    `workspace.controller.listMembers`, undocumented in `workspace.md`). Path,
>    status, message and body are byte-identical — this is a move, not a change,
>    and `frontend/src/lib/workspaces.ts#getWorkspaceMembers` needs no edit. It
>    moved because the roster's writes live here, and a resource whose read is
>    in one module and whose writes are in another has two owners and therefore
>    none.
> 3. **`member.repository.js` reads `Project` and writes `ProjectMember`** —
>    tables the project module owns. Removing someone from a workspace must
>    strip their project rows in the same transaction (§*Removal cascade*), and
>    splitting that across two repositories would put the transaction boundary
>    between two statements that must not be separable. Same rule, same reason,
>    as `invitation.repository.js` writing `Membership` (invitation.md
>    divergence 1): *one repository per module*, not one table per module.
> 4. **A `DELETE` that really does delete.** The inverse of invitation.md's
>    divergence 3. A revoked invitation keeps its row because *when it was
>    revoked* is the audit trail; a removed membership has nothing to audit that
>    the row itself carries — there is no `removedAt` column and adding one would
>    make every membership query filter on it. Re-adding a removed person is a
>    fresh invitation, which *is* audited.
> 5. **`PATCH` and `DELETE` carry `apiLimiter`; `GET` carries none.** Matching
>    the precedent exactly: invitation.md puts `apiLimiter` on revoke, and
>    `workspace.routes.js` puts no limiter on an authenticated read.

---

## Membership model — read this before any endpoint below

### Membership is the only fact about who is in a workspace

A `Membership` row (`userId`, `workspaceId`, `role`) is the whole answer. There
is no `Workspace.ownerId` column: **"the owner" means the membership whose role
is `OWNER`**, and the creator gets that row in the same transaction as the
workspace (`workspace.repository.js#createWorkspaceWithOwner`). Every
authorization decision in the app resolves through this row —
`permission.js#loadMembership` looks it up by the compound key
`userId_workspaceId`, and `project.js` refuses at step 1 without it.

Two consequences the endpoints below are shaped by:

- **Deleting a membership is a complete eviction**, instantly, from every
  project in the workspace — not only from the workspace screen.
- **A workspace with no `OWNER` membership is an unrecoverable state.** Nothing
  can delete it, nothing can bill it, nothing can change a role in it, because
  every one of those needs a permission only `OWNER` holds. That is what the
  last-owner guard below protects, and why it is enforced in the service rather
  than left to the permission table.

### The identifier is the membership id, not the user id

`:memberId` is `Membership.id`. The roster returns both (`id` the membership,
`userId` the person) and the DTO comment in `workspace.dto.js` already warns
that confusing them yields a `404` rather than silent nonsense. Membership id is
the right identifier here because it is scoped: a membership belongs to exactly
one workspace, so `(workspaceId, memberId)` mismatches are detectable, whereas a
`userId` is global and a caller passing one from another workspace would be
asking a question this module cannot answer safely.

### Role changes: the three things this endpoint will not do

| Refused | Status | Why |
|---|---|---|
| Set any role to `OWNER` | `422` | *Ownership is transferred, never granted.* The same rule the invitation validator enforces by omission (invitation.md §1), for the same reason: an endpoint that can mint an `OWNER` is a privilege-escalation endpoint. Transfer is its own future endpoint, and it must be a single transaction that demotes the outgoing owner — not two `PATCH`es with a window in between where the workspace has two owners or none. |
| Change the `OWNER`'s role | `422` | The demotion half of a transfer, reachable on its own. Allowed, it is exactly how a workspace reaches zero owners. |
| Change your **own** role | `422` | Self-demotion is the one role change nobody can undo: an `ADMIN` who drops to `MEMBER` loses the permission needed to climb back, and the only recovery is another admin or the database. Refusing costs one click; allowing it costs a support ticket. |

### The last-owner guard

Before any write that could reduce the number of `OWNER` memberships, the
service counts them in the workspace and refuses if the target is the last one.

It is **redundant today** — the two rules above already make an `OWNER`'s role
unchangeable and §*3* makes them unremovable, so the count can never reach zero
by either path. It is written anyway, and tested, because it is the invariant;
the other two rules are merely the places it currently bites. The moment
ownership transfer or "leave workspace" lands, they stop covering every path and
this guard is the only thing standing between a typo and a workspace nobody can
administer. A redundant check on an unrecoverable state is the cheapest line in
the module.

### Removal cascade

Deleting a `Membership` locks the user out of every project in the workspace
immediately — `project.js` step 1 is *no workspace membership → 404* — but it
does **not** delete their `ProjectMember` rows, which are keyed on
`(projectId, userId)` and cascade from `Project` and `User`, not from
`Membership`. Left alone, a removed person keeps appearing in every project
member panel and in every assignee picker: present in the UI, refused by the
API. So removal deletes them, in the same transaction, scoped to the projects of
that workspace.

**A member who owns a project in the workspace cannot be removed** (`409`). This
mirrors the schema's own choice: `Project.ownerId` is `onDelete: Restrict`
precisely so that losing a user never silently orphans projects, and removing
someone from the workspace is the same loss by a different route. The response
names the projects, so the client can say *"transfer these three first"* instead
of *"something went wrong"*. Auto-reassigning to the actor was the alternative
and is worse: it makes an irreversible ownership change a side effect of a
destructive action the caller thought they understood.

The list arrives as **`data.details.projects`**, not `data.projects`:
`error.middleware.js` builds an error's `data` as `{ code, ...(details && {
details }) }`, and `details` is the only channel an `AppError` has for structured
detail. It is an object here where every sibling passes the validator's
`[{ field, message }]` array — a divergence, and the narrow one: a per-field list
is the wrong shape for "these three projects block this", and inventing a second
`AppError` argument to carry it would change a class every module throws.

```json
{
  "success": false,
  "statusCode": 409,
  "message": "This member owns projects in this workspace. Transfer or delete them first.",
  "data": {
    "code": "CONFLICT",
    "details": {
      "projects": [
        { "id": "cmtr4i0b10007scj2y6f4mm31", "name": "Website relaunch", "key": "WEB" }
      ]
    }
  }
}
```

---

## Rate limiting

| Limiter | Window / max | Key | Why |
|---|---|---|---|
| *(none)* | — | — | `GET .../members` — an authenticated read of a bounded list, already behind `loadMembership`. Same call as every authenticated read in `workspace.routes.js`. |
| `apiLimiter` | 15m / 100 | IP | `PATCH` and `DELETE`. Not a brute-force surface (both need a valid membership id *and* a permission), so the general limiter is the right one; a bespoke limiter here would imply a threat that does not exist. |

Failure modes are identical to [auth.md](./auth.md#failure-modes): Redis
unreachable means **fail closed** — `429` with the standard envelope, via
`failClosed` in `shared/middlewares/rateLimiter.js`.

---

## Caching

Nothing here is cached. The roster is what the permission UI draws its own
enabled/disabled state from, so a stale hit shows an admin controls they no
longer hold — or hides ones they do. Same reasoning as
[invitation.md](./invitation.md#caching).

---

## Account enumeration

No endpoint in this module takes an email address, so there is no
existence oracle to close: a caller must already be a member of the workspace to
reach anything, and must already hold the roster to know a membership id.

Two cases are deliberately collapsed into one `404`, both in
`member.service.js#findMemberOrThrow`:

- a `:memberId` that never existed, and
- a `:memberId` that exists in **another** workspace.

They must be indistinguishable. Answering `403` on the second confirms to an
admin of workspace A that a given membership id is live in workspace B, which is
a membership-existence oracle across a trust boundary — the same argument
`loadMembership` makes for answering `404` to a non-member.

**Residual oracle, knowingly left open:** the roster returns every member's
email address to every member of the workspace, `MEMBER` role included. That is
the feature — a member list without addresses cannot support "invite the person
who mailed me" or "is this the right Priya" — and it is bounded by membership,
which is itself bounded by an invitation somebody with `member:invite` sent. It
is recorded here so that the next reader weighing "should `MEMBER` see emails?"
knows it was decided rather than overlooked.

---

## Guards

`authGuard` → `loadMembership` → `requirePermission(...)` on all three routes,
and `express.Router({ mergeParams: true })` on the router — without it
`req.params.workspaceId` is undefined inside the sub-router, `loadMembership`
cannot resolve a membership, and every request `400`s on a workspace id that is
visibly right there in the URL (the same trap invitation.md §*Guards* flags).

| Route | Permission | Roles that hold it |
|---|---|---|
| `GET` | `member:view` | OWNER, ADMIN, MEMBER |
| `PATCH` | `member:role:update` | **OWNER only** |
| `DELETE` | `member:remove` | OWNER, ADMIN |

**`PATCH` is OWNER-only, and that is a decision this doc is asking to be
confirmed.** `ROLE_PERMISSIONS` in `shared/constants/roles.js` grants
`member:role:update` to `OWNER` alone, and the file says so on purpose: *"it
makes the OWNER-only rows (delete the workspace, change roles, billing) obvious
at a glance"*. An `ADMIN` who can grant `ADMIN` can mint peers at will, and
since an `ADMIN` also holds `member:remove`, the pair is enough to reshape the
workspace's administration without the owner. The frontend's fixture
(`frontend/src/lib/demo-permissions.ts`) currently grants `members.roles` to
`ADMIN`, so **one of the two has to move** — see §*Open questions* 1.

`requirePermission` is used throughout, never `requireRole`: every check here is
about capability, and a role string hard-coded into a route is how the
permission table stops being the answer to "who may do this".

---

## 1. `GET /api/v1/workspaces/:workspaceId/members`

The roster — every active member with their user record and role.
`requirePermission(member:view)` — any member. No limiter.

**Moved unchanged** from the workspace module. Path, `200`, the message
`"Members fetched"` and the `{ members: [...] }` shape are all byte-identical to
what shipped; the frontend is untouched.

**`200`**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Members fetched",
  "data": {
    "members": [
      {
        "id": "cmtr4i0aa0001scj2h3p1qx7m",
        "userId": "cmtr4hzzz0000scj20k9wq1ab",
        "role": "OWNER",
        "createdAt": "2026-09-07T06:21:14.902Z",
        "user": {
          "id": "cmtr4hzzz0000scj20k9wq1ab",
          "name": "Wren Adisa",
          "email": "wren.adisa@example.com"
        }
      },
      {
        "id": "cmtr4i0aa0004scj2l8d3ke20",
        "userId": "cmtr4i04q0003scj2r7n5vv91",
        "role": "MEMBER",
        "createdAt": "2026-09-08T09:02:41.118Z",
        "user": {
          "id": "cmtr4i04q0003scj2r7n5vv91",
          "name": "Jonah Ferreira",
          "email": "j.ferreira@example.com"
        }
      }
    ]
  }
}
```

Owner first, then admins, then members, each group oldest first. The ordering is
`orderBy: [{ role: 'asc' }, { createdAt: 'asc' }]` and it works because Postgres
orders an enum by **declaration** order, and `Role` is declared `OWNER, ADMIN,
MEMBER` — most-privileged first without a `CASE`. Reordering the enum in
`schema.prisma` would silently reorder this response.

`user` is narrowed to three fields **at the query**, not only in the DTO: a
roster must never become a route to `passwordHash` or `emailVerifiedAt`, and a
`select` guarantees that without trusting a later reader to remember.

**No pagination**, unlike the paginated lists in `project.md`. A workspace's
membership is bounded by its seat count and the screen renders all of it at
once; paginating would add a cursor every caller must thread through for a list
that does not grow.

Pending invitations are **not** here — they are
`GET /api/v1/workspaces/:workspaceId/invitations`
([invitation.md](./invitation.md) §2). The members screen makes two calls and
renders two lists, because a pending invite has no `userId`, no `createdAt` that
means the same thing, and a status; folding it into this array would mean every
consumer branching on a half-populated row.

**Errors**

| Status | When |
|---|---|
| `401` | No/invalid access token. |
| `403` | `FORBIDDEN` — a member whose role lacks `member:view`. Unreachable with the current table (all three roles hold it); present because the route names the permission, not the roles. |
| `404` | Not a member of the workspace — **not `403`**. A non-member and a nonexistent workspace must be indistinguishable. |

---

## 2. `PATCH /api/v1/workspaces/:workspaceId/members/:memberId`

Changes one member's role. `requirePermission(member:role:update)` — **OWNER
only** (§*Guards*). `apiLimiter`.

| Field | Rules |
|---|---|
| `role` | required, `ADMIN` \| `MEMBER` |

**`OWNER` is absent from the `valid()` list rather than rejected by a rule** — a
closed list cannot be widened by a typo — and the service re-checks it anyway.
The duplication is deliberate and is the same call invitation.md §1 makes: a
validator only protects callers arriving over HTTP, and a service must not
assume one ran.

**`200`**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Member role updated",
  "data": {
    "member": {
      "id": "cmtr4i0aa0004scj2l8d3ke20",
      "userId": "cmtr4i04q0003scj2r7n5vv91",
      "role": "ADMIN",
      "createdAt": "2026-09-08T09:02:41.118Z",
      "user": {
        "id": "cmtr4i04q0003scj2r7n5vv91",
        "name": "Jonah Ferreira",
        "email": "j.ferreira@example.com"
      }
    }
  }
}
```

The full roster row comes back, not just the new role, so the client can replace
one row in place instead of refetching the list. Setting the role a member
already holds is a successful no-op returning the same body: idempotent, and
reporting failure for a state the caller asked for and got would be wrong.

A demotion takes effect on the member's **next request** — roles are read per
request by `loadMembership`, never cached and never baked into the access token.
That is the reason `auth.md` keeps the token payload to an identity and nothing
else: a role in a JWT is a role that stays true for fifteen minutes after it
stops being true.

**Errors**

| Status | When |
|---|---|
| `400` | Validation failed — `role` missing, or outside `ADMIN \| MEMBER`. |
| `401` | No/invalid access token. |
| `403` | `FORBIDDEN` — a member whose role lacks `member:role:update`. An `ADMIN` lands here today. |
| `404` | `NOT_FOUND` — the caller is not a member of the workspace, **or** `:memberId` does not exist, **or** it belongs to another workspace. All three answer identically; see §*Account enumeration*. |
| `422` | `VALIDATION_ERROR` — `role: "OWNER"` reached the service. Unreachable over HTTP; present because the service does not assume the validator ran. |
| `422` | `VALIDATION_ERROR` — the target is the workspace `OWNER`. *"A workspace owner's role is changed by transferring ownership, not here."* |
| `422` | `VALIDATION_ERROR` — the target is the caller's own membership. *"You cannot change your own role."* |
| `422` | `VALIDATION_ERROR` — the target is the last `OWNER`. Unreachable while the row above holds; the guard is the invariant, not the branch (§*The last-owner guard*). |
| `429` | `RATE_LIMITED`. |

`422` rather than `400` for all four: the request is well-formed and the values
are individually legal — it is the *state* that forbids it, which is exactly the
distinction `invitation.md` draws when it answers `422` to `role: "OWNER"`.

---

## 3. `DELETE /api/v1/workspaces/:workspaceId/members/:memberId`

Removes a member from the workspace. `requirePermission(member:remove)` — OWNER
or ADMIN. `apiLimiter`.

Deletes the `Membership` row **and** that user's `ProjectMember` rows in the
workspace's projects, in one transaction — see §*Removal cascade* for why the
second half is not optional.

**`200`**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Member removed",
  "data": null
}
```

`200` with a null `data`, not `204`. The house preference is an envelope
([api-response](../../.claude/skills/api-response/SKILL.md)); the `204`s in the
invitation module are the documented exception, taken there because a revoked
invitation still *has* a row the client must not be tempted to render. There is
no row to misrender here.

**Not idempotent, and deliberately not.** A second `DELETE` on the same
`:memberId` answers `404`, because a membership id is not a stable handle for a
person — it is gone, and the next invitation mints a new one. This is the
opposite call from invitation.md §6 (accept is idempotent), and the difference is
which is worse to get wrong: reporting failure for an accept that already
succeeded strands a user outside a workspace, while reporting success for a
removal that did not happen tells an admin a person is out when they are not.

**Errors**

| Status | When |
|---|---|
| `401` | No/invalid access token. |
| `403` | `FORBIDDEN` — a member whose role lacks `member:remove`; a plain `MEMBER` lands here. |
| `404` | `NOT_FOUND` — caller is not a member, **or** `:memberId` does not exist, **or** it belongs to another workspace. Indistinguishable by design. |
| `409` | `CONFLICT` — the member owns one or more projects in this workspace. `data.details.projects` lists `{ id, name, key }` so the client can name them. Transfer or delete those first. |
| `422` | `VALIDATION_ERROR` — the target is the workspace `OWNER`. *"A workspace owner cannot be removed. Transfer ownership first."* Removing the owner is how a workspace becomes unadministrable (§*Membership model*). |
| `422` | `VALIDATION_ERROR` — the target is the caller's own membership. *"Use leave workspace to remove yourself."* Self-removal is a different operation with a different guard — an `ADMIN` removing themselves is leaving, which needs no `member:remove` — and conflating the two puts a `MEMBER`'s exit behind a permission they do not hold. The endpoint is §*Open questions* 2. |
| `422` | `VALIDATION_ERROR` — the target is the last `OWNER`. Unreachable while the owner row above holds; kept as the invariant. |
| `429` | `RATE_LIMITED`. |

---

## Open questions

1. **Who may change a role — `OWNER`, or `OWNER` and `ADMIN`?** The backend
   table says `OWNER`; `frontend/src/lib/demo-permissions.ts` says both. The
   backend is the one that enforces, so the fixture is the likelier thing to fix,
   but the call is a product one: a workspace whose only owner is on holiday
   cannot promote anyone. If it moves, it is one line in `ROLE_PERMISSIONS` plus
   a rule here — *an `ADMIN` may not change another `ADMIN`'s role* — because
   without it two admins can demote each other and the last writer wins.
2. **`DELETE .../members/me` — leave workspace.** Deliberately not in this
   module yet. Any member may leave, so the guard is membership rather than
   `member:remove`, and the `OWNER` may not (same invariant). The `422` on
   self-removal above is what keeps the hole visible instead of quietly letting
   `DELETE :memberId` double as it.
3. **Ownership transfer.** `PATCH .../members/:memberId/transfer-ownership`,
   atomically promoting the target and demoting the caller. Three of this
   module's `422`s exist because it does not yet.
4. **Peer protection between admins** on `DELETE`. An `ADMIN` can currently
   remove another `ADMIN`. Defensible (they are trusted equals) and also how a
   rogue admin clears the deck. Unresolved on purpose; it belongs with
   question 1, since granting `ADMIN` the role-change permission is what makes
   it urgent.

---

## Files

| File | Responsibility |
|---|---|
| `src/modules/member/member.controller.js` | `req` → service → `ApiResponse`. No rules. |
| `src/modules/member/member.service.js` | The guards above — owner, self, last-owner, project-ownership — and the removal transaction. Throws `AppError`. |
| `src/modules/member/member.repository.js` | Every Prisma call: `Membership` reads/writes, the `OWNER` count, the owned-project lookup, the `ProjectMember` cleanup. |
| `src/modules/member/member.routes.js` | Mounted at `/api/v1/workspaces/:workspaceId/members` from `src/routes/index.js`, `mergeParams: true`. |
| `src/modules/member/member.dto.js` | `toMember` — the roster row. A whitelist, never a `delete row.field`. |
| `src/modules/member/member.validator.js` | `updateRoleSchema`, `memberParamsSchema`. |
| `src/shared/constants/roles.js` | `member:view`, `member:remove`, `member:role:update` and who holds them. |
| `src/shared/middlewares/permission.js` | `loadMembership`, `requirePermission`. |
| `docs/api/invitation.md` | How someone *becomes* a member. Read alongside this. |
