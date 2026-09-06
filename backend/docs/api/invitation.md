# `invitation` — API contract

**Module:** `src/modules/invitation/` · **Route prefixes:**
`/api/v1/workspaces/:workspaceId/invitations` (admin) and `/api/v1/invitations`
(recipient)

> **Sibling-contract check.** Response envelope, `AppError` shape,
> validation-error shape, guard middleware names and rate-limiter precedent all
> match [auth.md](./auth.md): `{ success, statusCode, message, data }` from
> `ApiResponse`, services throwing `AppError` with a `data.code`, `validate`
> producing `400` with a per-field `details` array, and
> `authGuard` / `loadMembership` / `requirePermission` from `shared/middlewares/`.
>
> **Deliberate divergences, four of them:**
>
> 1. **`invitation.repository.js` writes `Membership` rows** — a table it does
>    not otherwise own. Accepting is one atomic operation (create the membership,
>    close the invitation) and splitting it across two repositories would put the
>    transaction boundary between two statements that must not be separable. The
>    house rule is *one repository per module*, not one table per module (§6.8).
> 2. **`GET /invitations/:token` is the only unauthenticated route outside
>    `auth`**, and unauthenticated by necessity: the recipient has no account
>    yet. Its response is capped at what the invitation email already told the
>    reader — see §*Disclosure ceiling*.
> 3. **A `DELETE` that does not delete.** `DELETE .../invitations/:id` sets
>    `revokedAt` and keeps the row. The verb describes what the admin does to the
>    *invitation*, not what happens to the row; the audit trail is the point
>    (§3.6, §7.1).
> 4. **Two route prefixes for one module.** Admin routes are workspace-scoped
>    because `permission.js` resolves membership from `(userId, workspaceId)`;
>    recipient routes are token-scoped because the recipient has no membership to
>    resolve. See §*Guards*.

---

## Invitation lifecycle — read this before any endpoint below

### Status is derived, never stored

There is no `status` column. Four nullable timestamps record what happened, and
`invitation.dto.js` derives the status from them **in this order**:

| Check, in order | Status |
|---|---|
| `revokedAt` set | `REVOKED` |
| `declinedAt` set | `DECLINED` |
| `acceptedAt` set | `ACCEPTED` |
| `expiresAt < now` | `EXPIRED` |
| otherwise | `PENDING` |

A stored status is a second source of truth that drifts the moment one write
path forgets to update it. The timestamps are what an audit needs anyway — *when*
was it revoked, not merely *that* it was.

**The order is the contract.** A row can satisfy several conditions at once — a
revoked invitation that has also expired, an accepted one whose `expiresAt` has
since passed — and the first match wins. Reordering silently changes what the
members screen reports about rows nobody notices until they matter.

### Legal transitions

```
PENDING ──accept──► ACCEPTED   (terminal)
        ──decline─► DECLINED   (terminal)
        ──revoke──► REVOKED    (terminal)
        ──time────► EXPIRED    (terminal, and reversible only by a resend)
```

All four are terminal. `resend` does not transition a row: it rotates the token
and pushes `expiresAt` out on a row that is still `PENDING`.

### One live invitation per address per workspace

Enforced by a **partial** unique index, hand-written into the sprint 1 migration
because Prisma's DSL cannot express one:

```sql
CREATE UNIQUE INDEX invitations_live_email_workspace
  ON invitations (email, "workspaceId")
  WHERE "acceptedAt" IS NULL AND "declinedAt" IS NULL AND "revokedAt" IS NULL;
```

An *unconditional* `UNIQUE(email, workspaceId)` — which the schema had before —
makes "revoke, then re-invite the same person" fail forever against a row the
admin can no longer see. Scoping uniqueness to rows in no terminal state keeps
the audit trail and still refuses a second live token.

`invitation.repository.js#findLive` uses the same three-null condition, and the
two must stay in agreement: the query produces the friendly `409 INVITE_PENDING`,
and the index is what stops two admins racing from creating two live rows anyway.

### The email-binding rule

**The signed-in account's address must equal `Invitation.email`** to accept or
decline. Without it, anyone who obtains a link joins the workspace as themselves,
which would make the token a bearer credential for membership rather than a
message to one person. Links leak in forwarded mail, shared screenshots and
browser history; binding is what makes that survivable.

| Situation | Response |
|---|---|
| emails match, account verified | accept |
| emails differ | `403 INVITE_EMAIL_MISMATCH` |
| emails match, account unverified | accepted, **and the account becomes verified** |
| already a member | `200`, no-op |

The third row is not a leniency. The token was mailed to that address and came
back, which is exactly what a verification email proves (§6.3) — so requiring a
*separate* verification would be asking for the same proof twice.

---

## Disclosure ceiling on the public lookup

`GET /invitations/:token` answers an unauthenticated stranger who may not be the
intended recipient. Its response shape is a **ceiling, not a starting point**
(§6.7):

```
{ token, workspaceId, workspaceName, invitedByName, role }
```

No member list, no member count, no inviter email, no workspace settings. Each of
those is a fact about an organization the caller has not joined, disclosed to
anyone who obtains a link. The fields that *are* present are exactly what the
invitation email already told them.

`invitation.dto.js#toPublicInvitation` is a whitelist for the same reason
`auth.dto.js#toUser` is: a column added to the model later cannot leak by
default.

---

## Enumeration: three dead states collapse into `404`

**Revoked, declined, already-accepted and never-existed all answer `404`.** Only
`EXPIRED` is distinguished, with `410`.

Two independent reasons:

1. **The frontend has three states, not six.** `InvitationLookup` in
   `frontend/src/types/invite.ts` is `VALID | EXPIRED | UNKNOWN`, and the shipped
   copy for `UNKNOWN` already reads *"mistyped, cancelled, or already used."*
   Inventing a fourth state breaks the page rather than informing it.
2. **Distinguishing *revoked* from *never existed* tells a token-guesser that a
   token was once real** — which is the single most useful bit of feedback a
   guessing attack could receive.

`EXPIRED` is separated because it is the one recoverable state: the UI can
honestly say "ask for a new invitation", and an expired token being real is not
news to whoever holds it.

Admin routes scope every lookup to the `workspaceId` in the path, so an id
belonging to another workspace answers `404` rather than `403` — a `403` would
confirm that some other workspace holds that invitation.

---

## Tokens

| Setting | Env var | Default |
|---|---|---|
| Invitation TTL | `INVITE_TTL_DAYS` | `7` |
| Per-workspace send limit | `INVITE_MAX_PER_WORKSPACE_HOUR` | `50` |
| Token entropy | *code constant* | 32 CSPRNG bytes, base64url |

**7 days is tied to shipped copy.** The frontend says *"Invitation links last
seven days."* Change `INVITE_TTL_DAYS` and that sentence becomes a lie — both
move together or neither does.

Tokens are **base64url** specifically because they ride in a URL path segment
(`/invite/<token>`): base64's `+` and `/` would need escaping there, base64url's
`-` and `_` do not.

Only the **SHA-256 hash** is stored. A database dump of raw invitation tokens is
a set of working links into every workspace; a dump of hashes is not. The
consequence is that **the worker cannot rebuild the link from the row**, so the
raw token is passed into the job payload at mint time (§7.5) — the one moment it
can be handed on. Not bcrypt, for the same reason as refresh tokens: 256 bits of
randomness has nothing to brute-force, and a per-row salt would make
`findUnique({ tokenHash })` impossible.

**Resend rotates the token.** Re-using it would mean a link the admin believes
they replaced still works — and "resend" is exactly what an admin does when they
suspect the first link went astray.

---

## Rate limiting

| Limiter | Window / max | Key | Why |
|---|---|---|---|
| `inviteSendLimiter` | 1h / 50 | **workspace** | An admin mass-inviting sends mail from *our* domain to strangers who never asked for it. This is a spam-reputation guard, and the workspace is the unit doing the sending — keyed per user, three admins in one workspace would get three times the budget. |
| `inviteLookupLimiter` | 15m / 30 | IP | The public route. What makes brute-forcing a 256-bit token pointless in practice as well as in theory. |
| `apiLimiter` | 15m / 100 | IP | accept, decline, revoke |

Failure modes are identical to [auth.md](./auth.md#failure-modes): Redis
unreachable means **fail closed**, `429` with the standard envelope.

---

## Caching

Nothing here is cached. A stale pending-list would show an admin an invitation
they just revoked, and a stale token lookup would let a revoked link keep
resolving — the exact states the derived status exists to report correctly.

---

## Guards

**Admin routes:** `authGuard` → `loadMembership` → `requirePermission(...)`.
`MEMBER_INVITE` for create/revoke/resend, `MEMBER_VIEW` for the list. The
workspace **must** be in the path, because `permission.js` resolves the caller's
membership from `(userId, workspaceId)` — with no workspace there is nothing to
check a role against.

`loadMembership` answers `404` for a non-member, not `403`: confirming that a
workspace exists to someone with no access to it is itself the leak.

**Recipient routes:** `authGuard` on accept and decline; **no guard at all** on
the lookup.

`express.Router({ mergeParams: true })` on the admin router is load-bearing —
without it `req.params.workspaceId` is undefined inside the sub-router, so
`loadMembership` cannot resolve a membership and every request `400`s on a
workspace id that is visibly right there in the URL.

---

## 1. `POST /api/v1/workspaces/:workspaceId/invitations`

Invites someone by email. `requirePermission(member:invite)` — OWNER or ADMIN.
`inviteSendLimiter` (1h / 50 per workspace).

| Field | Rules |
|---|---|
| `email` | string, ≤254, valid, **lowercased + trimmed** |
| `role` | `ADMIN` \| `MEMBER`, default `MEMBER` |

**`role` is restricted at the validator *and* re-checked in the service.** An
endpoint that can mint an OWNER is a privilege-escalation endpoint, and one layer
of defence is not enough for that: a validator only protects callers that arrive
over HTTP, and the service is reachable from a worker or a script.
`frontend/src/types/workspace.ts`: *"Ownership is transferred, never granted by
invitation."* In the schema, OWNER is **absent from the `valid()` list** rather
than rejected by a rule — a closed list cannot be widened by a typo.

**`201`**

```json
{
  "success": true,
  "statusCode": 201,
  "message": "Invitation sent",
  "data": {
    "invitation": {
      "id": "cmtpb7x7k0002scj21st4awks",
      "email": "invitee@example.com",
      "role": "MEMBER",
      "status": "PENDING",
      "invitedByName": "Owner O",
      "expiresAt": "2026-09-13T04:26:37.663Z",
      "createdAt": "2026-09-06T04:26:37.664Z"
    }
  }
}
```

`tokenHash` is never returned. The mail is queued, never sent inline — the
request returns as soon as the row is committed, and SMTP latency and retries
belong to the worker.

**Errors**

| Status | When |
|---|---|
| `400` | Validation failed, or `role` outside `ADMIN \| MEMBER`. |
| `403` | `FORBIDDEN` — a member of the workspace whose role lacks `member:invite`. |
| `404` | Not a member of the workspace — **not `403`**. A non-member and a nonexistent workspace must be indistinguishable. |
| `409` | `ALREADY_MEMBER` — that address is already in the workspace. A token that could only ever be a no-op should not be minted (§6.5). |
| `409` | `INVITE_PENDING` — a live invitation already exists for that address. |
| `422` | `role: "OWNER"` reaching the service. Unreachable over HTTP; present because the service does not assume the validator ran. |
| `429` | `RATE_LIMITED`. |

---

## 2. `GET /api/v1/workspaces/:workspaceId/invitations`

Lists **pending** invitations. `requirePermission(member:view)` — any member.

**`200`**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Pending invitations",
  "data": {
    "invitations": [
      {
        "id": "cmtpb7x7k0002scj21st4awks",
        "email": "invitee@example.com",
        "role": "MEMBER",
        "status": "PENDING",
        "invitedByName": "Owner O",
        "expiresAt": "2026-09-13T04:26:37.663Z",
        "createdAt": "2026-09-06T04:26:37.664Z"
      }
    ]
  }
}
```

**Pending only** — revoked, declined, accepted and expired rows are excluded even
though they are deliberately kept in the table. The members screen shows
outstanding invitations beside the roster; it is not a history log, and mixing
tombstones into it would make "who is still waiting?" unanswerable at a glance.

**Errors**

| Status | When |
|---|---|
| `403` | Role lacks `member:view`. |
| `404` | Not a member. |

---

## 3. `DELETE /api/v1/workspaces/:workspaceId/invitations/:id`

Cancels an invitation. `requirePermission(member:invite)`. `apiLimiter`.

**`204`**, no body.

**This does not delete the row** — it sets `revokedAt`. The row is the audit
record of who invited whom and when, and destroying it to satisfy the verb would
trade the reason the terminal states are timestamps for a naming preference. From
the client's side the invitation is simply gone, which is why nothing is
returned: sending the tombstone back would invite a caller to render it.

Revoking then re-inviting the same address **succeeds** — that is the partial
unique index doing its job.

**Errors**

| Status | When |
|---|---|
| `404` | Unknown id, an id belonging to another workspace, or an invitation that is not `PENDING`. All three collapse — see §*Enumeration*. |
| `403` | Role lacks `member:invite`. |

---

## 4. `POST /api/v1/workspaces/:workspaceId/invitations/:id/resend`

Re-sends, **rotating the token**. `requirePermission(member:invite)`.
`inviteSendLimiter`.

**`200`** with the same `invitation` shape as §1 and a pushed-out `expiresAt`.

The old link stops working immediately. See §*Tokens*.

**Errors** — identical to §3.

---

## 5. `GET /api/v1/invitations/:token`

Resolves a raw token for the accept screen. **Public — no guard.**
`inviteLookupLimiter` (15m / 30 per IP).

**`200`**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Invitation",
  "data": {
    "invitation": {
      "token": "1h3k6aYaJ_wpqZTEHQ3T8djFotJfseagBLX0I-5yP24",
      "workspaceId": "cmtpb7iq000022vj21xk573c8",
      "workspaceName": "WS 85653",
      "invitedByName": "Owner O",
      "role": "MEMBER"
    }
  }
}
```

Unauthenticated **by necessity**: the recipient has no account, and requiring one
would recreate the deadlock §8.4 exists to break. The response shape is a ceiling
— see §*Disclosure ceiling*.

**Errors**

| Status | When |
|---|---|
| `404` | `NOT_FOUND` — unknown, revoked, declined, or already accepted. Deliberately indistinguishable; see §*Enumeration*. |
| `410` | `TOKEN_EXPIRED` — the one recoverable state, so the one worth separating. |
| `429` | `RATE_LIMITED`. |

---

## 6. `POST /api/v1/invitations/:token/accept`

Joins the workspace. **`authGuard`.** `apiLimiter`.

**`200`**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Invitation accepted",
  "data": {
    "workspaceId": "cmtpb7iq000022vj21xk573c8",
    "role": "MEMBER",
    "alreadyMember": false
  }
}
```

**Idempotent.** A second accept returns `200` with `"alreadyMember": true`, and
there is still one `Membership` row. A double-clicked Accept must not report
failure for something that succeeded (§6.5), so the unique constraint is never
allowed to surface as a `409`.

**The row is locked `FOR UPDATE` inside the transaction and its state re-read
after acquiring the lock.** Without it, an accept racing a revoke can both read
the row as pending and both succeed — the admin sees the invitation cancelled and
the recipient is a member anyway. Prisma has no `FOR UPDATE` in its query API, so
`invitation.repository.js#lockByIdForUpdate` issues raw SQL, and it requires a
`tx` rather than defaulting to one: a row lock outside a transaction is released
immediately and would be pure overhead pretending to be a guard.

If the accepting user is still unverified *and the addresses match*,
`emailVerifiedAt` is set — see §*The email-binding rule*.

**Errors**

| Status | When |
|---|---|
| `401` | Not signed in. |
| `403` | `INVITE_EMAIL_MISMATCH` — signed in as a different address. The message **names the address to sign in as**, which is safe: whoever holds the token was already told it by the email that carried it. The trap is ordinary (invited at `bob@work.com`, signed in as `bob@personal.com`) and failing silently there is a dead end. |
| `404` | Unknown, revoked, declined, or accepted by someone else. |
| `410` | `TOKEN_EXPIRED`. |

---

## 7. `POST /api/v1/invitations/:token/decline`

Refuses an invitation. **`authGuard`**, same email binding. `apiLimiter`.

**`204`**. Sets `declinedAt`; the link then `404`s.

The binding applies here too: only the addressee may decline. Otherwise anyone
holding a leaked link could cancel an invitation meant for someone else.

**Errors** — identical to §6, minus `410`.

---

## 8. `inviteToken` on `POST /api/v1/auth/register` — the deadlock fix

Documented in full at [auth.md §1](./auth.md#1-post-apiv1authregister); repeated
here because the reason lives in this module.

Without it the invite path **cannot complete**:

```
register → emailVerifiedAt null, no session
   → login → 403 EMAIL_NOT_VERIFIED
      → cannot reach the accept screen
         → waiting on a verification email that never arrives
```

Neither half is wrong alone — "registration issues no session until the address
is proved" and "login refuses unverified accounts" are both correct rules. They
are only wrong *together*, on this one path, and only because the invitation
already proved the address that the verification email was going to prove.

A valid token whose address matches the registered email produces, in one
transaction: a user with `emailVerifiedAt = now`, a `Membership`, a closed
invitation, **and a session** — so the response carries both cookies and
`data.inviteApplied: true`.

**A bad, expired or mismatched token must NOT fail the registration.** The
account is created normally, a verification email is queued, and the response
carries `data.inviteApplied: false`. Losing an account because an invitation
expired mid-signup is a worse outcome than an extra click, so
`invitation.service.js#applyInviteTokenOnRegister` returns `false` on every
failure path including an unexpected throw.

---

## Files

| Path | Holds |
|---|---|
| `src/modules/invitation/invitation.routes.js` | both route scopes, middleware order |
| `src/modules/invitation/invitation.controller.js` | `req`/`res` only |
| `src/modules/invitation/invitation.service.js` | lifecycle rules, email binding, the accept transaction |
| `src/modules/invitation/invitation.repository.js` | every Prisma call, including `Membership` and the `FOR UPDATE` lock |
| `src/modules/invitation/invitation.dto.js` | derived status, both response whitelists |
| `src/modules/invitation/invitation.validator.js` | Joi schemas, the closed `role` list |
| `prisma/migrations/…_auth_and_invitations/migration.sql` | the partial unique index |
| `src/workers/email.worker.js` | `send-invitation`, which takes the raw token from the payload |
