# Plan — Authentication & invitations (backend)

**Status:** design, not yet implemented. Neither `src/modules/auth/` nor
`src/modules/invitation/` exists.
**Scope:** `backend/` only. Two coupled modules:

1. **auth** — email/password, login codes, Google & GitHub OAuth (Passport),
   access/refresh token rotation.
2. **invitation** — Trello/Notion-style workspace invitations: an admin invites
   by email, and the recipient registers or signs in *through the invite link*
   and lands as a member.

They are coupled because §6 is where they meet: an invited person has no
account, so the invite link is also a registration entry point — and that
creates a deadlock (§6.4) if the two are designed apart.

**Satisfies:** `frontend/.claude/specs/authentication.md §9` — the HTTP contract
the frontend was already built against — and the flow in
`frontend/.claude/plan/member-flow.md`.
**Governed by:** [module-consistency](../skills/module-consistency/SKILL.md),
[api-response](../skills/api-response/SKILL.md),
[api-contract-doc](../skills/api-contract-doc/SKILL.md),
[error-handling](../rules/error-handling.md), [logging](../rules/logging.md).

---

## 1. What already exists

Read this before designing anything — most of the contract is already decided.

| Where | What it already fixes |
|---|---|
| `frontend/.claude/specs/authentication.md` §9 | endpoint list, bodies, status codes, hashing, token TTLs, rate limits, enumeration rules, account-linking rule |
| `frontend/src/types/auth.ts` | the `user` object shape and the **closed** `AuthErrorCode` union |
| `frontend/src/lib/auth.ts`, `auth-tokens.ts` | fixture implementations — the seam a real `fetch` replaces, one file |
| `frontend/src/components/auth/*` | sign-up form, two-step sign-in (code-first), social grid — all built, all waiting on this |
| `backend/prisma/schema.prisma` | `User`, `Workspace`, `Membership`, **`Invitation`** already migrated |
| `frontend/.claude/plan/member-flow.md` | the invite flow, end to end, already drawn |
| `frontend/src/app/(auth)/invite/[token]/page.tsx` | the accept screen — dead-link states, signed-in/signed-out split, all built |
| `frontend/src/types/workspace.ts` | `WorkspaceInvitation`, `PendingInvitation`, `InvitationLookup`, `INVITABLE_ROLES` |
| `backend/src/shared/constants/roles.js` | `MEMBER_INVITE` / `MEMBER_REMOVE` / `MEMBER_ROLE_UPDATE`, already granted per role |
| `backend/src/workers/email.worker.js` | a `send-invitation` job that reads the invitation back and guards revoked/accepted |
| `backend/src/shared/middlewares/auth.js` | `authGuard` — verifies a Bearer JWT, attaches `req.user` |
| `backend/src/shared/middlewares/rateLimiter.js` | `authLimiter` — 10 req / 15 min, already matches the spec's login limit |

The frontend is **finished and waiting**. It calls fixtures today; every screen,
error state and focus rule already exists. This module's job is to make the
fixtures unnecessary — not to redesign the flow.

### What is missing

| Gap | Consequence |
|---|---|
| `User.emailVerified` does not exist | frontend's `user.emailVerified` cannot be populated |
| No OAuth identity table | Google/GitHub cannot link to an account |
| No refresh/session table | no way to revoke a session, no refresh flow |
| No login-code table | the code-first sign-in (the *default* path) cannot work |
| No verification/reset token table | verify-email and password reset cannot work |
| `authGuard` reads only `Authorization: Bearer` | the frontend sends cookies, not headers |
| `Invitation.token` is stored **in plaintext** | a DB leak hands over every pending invitation (§3.6) |
| No `revokedAt` / `declinedAt` on `Invitation` | admin cannot cancel; the built Decline button has nowhere to write |
| `@@unique([email, workspaceId])` is unconditional | re-inviting a removed member hits a 409 forever (§3.6) |
| Nothing links registration to an invitation | the register → verify → login **deadlock**, §6.4 |

---

## 2. Three conflicts, and how they resolve

These are decisions, not details. Each changes code on one side or the other.

### 2.1 Session model — cookie *vs* access/refresh tokens

Spec §9 says: *"Session: httpOnly, Secure, SameSite=Lax cookie … 30 days …
never readable by JS and never placed in localStorage."*
The requirement here is: short access token + refresh endpoint that mints a new
one.

**These are not in conflict — they are answering different questions.** The spec
constrains *where the credential lives* (an httpOnly cookie). The requirement
constrains *how long it lives and how it is renewed*. Both hold at once:

> **Both tokens are httpOnly cookies.** The access token is a short-lived
> stateless JWT; the refresh token is a long-lived opaque value validated
> server-side. Neither is ever readable by JavaScript, neither is ever returned
> in a JSON body, and nothing goes in `localStorage`.

This is strictly better than the common `localStorage` access-token pattern: it
satisfies the requirement in full while keeping the spec's XSS guarantee. The
spec's "opaque, server-side-validated session token" *is* the refresh token.

### 2.2 Error envelope — `data.code` instead of `error.code`

| Side | Shape |
|---|---|
| Spec §9 | `{ "error": { "code": "INVALID_CREDENTIALS", "message": "…" } }` |
| Backend house rule | `{ success, statusCode, message, data }` — [api-response](../skills/api-response/SKILL.md), *"controllers never hand-roll `res.json()`"* |

The backend envelope is a repo-wide invariant shared by every future module;
bending it for one module is exactly the drift `module-consistency` exists to
prevent. The frontend needs only the machine-readable **code** — it maps codes
to copy and never renders a server message (`types/auth.ts`).

**Resolution: keep the backend envelope; carry the code at `data.code`.**

```json
{ "success": false, "statusCode": 401,
  "message": "Invalid email or password",
  "data": { "code": "INVALID_CREDENTIALS" } }
```

Cost: the error-unwrapping helper in `frontend/src/lib/auth.ts` reads
`body.data.code` rather than `body.error.code`. That file and its sibling
`auth-tokens.ts` are the adapter seam the spec already nominated for exactly
this swap — `auth.ts`'s own header states that replacing the fixture bodies
with `fetch` *"is a change to this file and nothing else"*. **Record the
divergence in `docs/api/auth.md` §1.**

`AppError` already carries a third `details` argument, which the error
middleware puts in `data` — so this needs no new machinery, only the discipline
of always passing `{ code: 'X' }`.

### 2.3 OAuth start path is wrong in the frontend

`frontend/src/components/auth/social-buttons.tsx` links to
`/api/auth/oauth/{provider}/start`. Spec §9's base path is `/api/v1/auth`, so
the correct URL is `/api/v1/auth/oauth/{provider}/start`. The component is out
of sync with its own spec. One-line frontend fix when OAuth ships; the backend
follows the spec, not the component.

---

## 3. Database design

Six models. Existing `User` is extended; five are new.

### 3.1 `User` — extended

```prisma
model User {
  id              String    @id @default(cuid())
  email           String    @unique          // ALWAYS stored lowercased+trimmed
  name            String?
  passwordHash    String?                    // null for OAuth-only accounts
  emailVerifiedAt DateTime?                  // null = unverified
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  memberships        Membership[]
  sentInvitations    Invitation[]        @relation("InvitationInvitedBy")
  oauthAccounts      OAuthAccount[]
  refreshTokens      RefreshToken[]
  loginCodes         LoginCode[]
  verificationTokens VerificationToken[]

  @@map("users")
}
```

**`emailVerifiedAt DateTime?`, not `emailVerified Boolean`.** A timestamp
answers both *"is it verified"* (a null check) and *"when"*, which support and
audit both ask for eventually. A boolean throws the second away permanently, and
you cannot reconstruct it later. `auth.dto.js` maps it to the boolean the
frontend's `User` type expects — the DTO layer exists precisely so a storage
choice and a wire shape can differ.

**`passwordHash` stays nullable.** An account created through Google has no
password. Making the column required forces writing a junk hash — an unusable
credential that still looks like a credential to every future reader of the
table, and to any code that checks `if (user.passwordHash)`.

**Email normalization is a storage invariant, not a validation nicety.** Lowercase
and trim in `auth.validator.js`, written back to `req.body` (the validator layer
owns normalization per module-consistency). If two layers disagree about case,
`findUnique({ email })` silently misses and you get duplicate accounts.

### 3.2 `OAuthAccount` — one row per linked provider identity

```prisma
model OAuthAccount {
  id                String        @id @default(cuid())
  userId            String
  provider          OAuthProvider
  providerAccountId String        // the provider's stable id (Google `sub`, GitHub `id`)
  emailAtProvider   String?       // captured at link time, for audit only
  createdAt         DateTime      @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
  @@index([userId])
  @@map("oauth_accounts")
}

enum OAuthProvider {
  GOOGLE
  GITHUB
}
```

**A table, not `googleId` / `githubId` columns on `User`.** A column per provider
means a migration every time a provider is added and a NULL for every user who
does not use that one. A row per link keeps the schema constant as providers
arrive, and lets one user hold several.

**Unique on `(provider, providerAccountId)`, never on email.** The provider's
account id is the only stable identifier — people change their email at Google
and the `sub` does not move. Uniqueness on email would also break the moment one
person links both Google and GitHub with the same address.

**`emailAtProvider` is audit data, never a lookup key.** It records what the
provider claimed at link time. Reading it back to find a user would reintroduce
the mutable-identifier bug the compound key exists to avoid.

### 3.3 `RefreshToken` — the session table

```prisma
model RefreshToken {
  id           String    @id @default(cuid())
  userId       String
  tokenHash    String    @unique   // SHA-256 of the opaque token; raw value never stored
  familyId     String              // rotation lineage — see §4.3
  expiresAt    DateTime
  revokedAt    DateTime?
  replacedById String?             // the token this one rotated into
  userAgent    String?
  ip           String?
  createdAt    DateTime  @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([familyId])
  @@index([expiresAt])
  @@map("refresh_tokens")
}
```

**Stored hashed.** This is the one table whose plaintext contents are directly
usable as credentials. A read-only leak — a backup, a log line, a `SELECT`-only
SQL injection — hands over every live session. Hashing makes the dump inert.

**SHA-256 here, bcrypt for login codes (§3.4). The hash follows the entropy of
the input, not the table.** A refresh token is already 256 bits of CSPRNG output,
so there is nothing to brute-force and a slow KDF buys nothing — and refresh runs
on every access-token expiry, so bcrypt would be a self-inflicted latency tax on
the hottest auth path.

**`familyId` is what makes rotation a theft detector rather than hygiene.**
Rotation alone only shortens a stolen token's life. Reuse detection (§4.3) needs
to know that two tokens are the same lineage.

**`userAgent` / `ip` are for the future "sign out other devices" screen**, which
spec §1 lists as out of scope for v1. Capturing them now costs two columns;
backfilling them later is impossible for sessions that already exist.

### 3.4 `LoginCode` — the 6-digit code that is the *default* sign-in path

```prisma
model LoginCode {
  id         String    @id @default(cuid())
  userId     String
  codeHash   String              // bcrypt — 6 digits IS brute-forceable
  attempts   Int       @default(0)
  expiresAt  DateTime
  consumedAt DateTime?
  createdAt  DateTime  @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@map("login_codes")
}
```

**bcrypt, not SHA-256.** A 6-digit code has 10⁶ possibilities. If a SHA-256 hash
leaks, the whole space is enumerable in milliseconds on a laptop. bcrypt at cost
10 pushes that far past the 10-minute expiry.

**`attempts` lives on the row, not in Redis.** The 5-attempt cap must survive a
Redis restart and a deploy. A counter that resets when a process restarts is not
a cap. Spec §9: *"six digits is only 10⁶, so without an attempt cap a code is
brute-forceable in seconds."*

**Rows are kept after consumption, not deleted**, so `consumedAt` can prove
single-use. A nightly job prunes rows older than 24h.

### 3.5 `VerificationToken` — email verification *and* password reset

```prisma
model VerificationToken {
  id         String       @id @default(cuid())
  userId     String
  tokenHash  String       @unique   // SHA-256 of ≥128 bits of entropy
  purpose    TokenPurpose
  expiresAt  DateTime
  consumedAt DateTime?
  createdAt  DateTime     @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, purpose])
  @@map("verification_tokens")
}

enum TokenPurpose {
  EMAIL_VERIFY      // 24 hour expiry
  PASSWORD_RESET    // 1 hour expiry
}
```

**One table with a purpose enum, but `LoginCode` stays separate.** Verify and
reset are the *same shape*: high entropy, hashed, single-use, one expiry, no
attempt counter. Splitting them duplicates a schema and every query against it.
The login code is a genuinely different shape — low entropy, an attempt counter,
a different hash function — and merging it would force a nullable `attempts`
column onto rows that can never use it.

**The `purpose` is part of the lookup, never assumed.** A token minted for
EMAIL_VERIFY must not be redeemable at `/reset-password`; look up by
`tokenHash` **and** `purpose`, or a 24-hour verification link becomes a
24-hour password-reset link.

### 3.6 `Invitation` — rework of an existing table

The table is already migrated, and three things about it are wrong for the flow
the frontend has already built.

```prisma
model Invitation {
  id          String    @id @default(cuid())
  email       String              // the invited address, lowercased+trimmed
  workspaceId String
  role        Role      @default(MEMBER)   // ADMIN | MEMBER — never OWNER
  tokenHash   String    @unique   // WAS `token`, plaintext
  invitedById String
  expiresAt   DateTime            // created + 7 days
  acceptedAt  DateTime?
  declinedAt  DateTime?           // NEW
  revokedAt   DateTime?           // NEW
  acceptedById String?            // NEW — who actually redeemed it
  createdAt   DateTime  @default(now())

  workspace  Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  invitedBy  User      @relation("InvitationInvitedBy", fields: [invitedById], references: [id])
  acceptedBy User?     @relation("InvitationAcceptedBy", fields: [acceptedById], references: [id])

  @@index([workspaceId])
  @@index([email])
  @@map("invitations")
}
```

**Change 1 — `token` becomes `tokenHash`.** An invitation token is a bearer
credential: possession of it grants membership of a workspace at a chosen role.
Every other bearer token in this plan is hashed (§3.3, §3.5); this one was not,
so a read-only database leak would hand over every pending invitation at once.
Same treatment: 32 random bytes, base64url (it travels in a URL path segment),
stored as SHA-256. Not bcrypt — 256 bits of entropy has nothing to brute-force.

**Change 2 — revoked and declined are real states.** `InviteAcceptActions` on
the frontend already renders a Decline button, and an admin who mistypes an
address needs to cancel. Neither has anywhere to write today.

**Change 3 — the unique constraint must become partial.** `@@unique([email,
workspaceId])` today is unconditional, so:

> invite bob@x → bob accepts → bob is later removed from the workspace →
> re-inviting bob hits the constraint and 409s **forever**, because the accepted
> row never goes away.

The rule that is actually wanted is *"one **live** invitation per address per
workspace"*. Prisma's schema DSL cannot express a partial unique index, so it
goes in the migration as raw SQL:

```sql
-- one live invitation per (email, workspace); history is preserved
CREATE UNIQUE INDEX invitations_live_email_workspace
  ON invitations (email, "workspaceId")
  WHERE "acceptedAt" IS NULL
    AND "declinedAt" IS NULL
    AND "revokedAt"  IS NULL;
```

Deleting accepted rows instead would be simpler and wrong: the audit trail of
who invited whom into a workspace is exactly the record you want during a
security review.

**Status is derived, never stored.** The frontend's `PendingInvitation.status`
is computed from the timestamps, in this order:

| Check | Status |
|---|---|
| `revokedAt` set | `REVOKED` |
| `declinedAt` set | `DECLINED` |
| `acceptedAt` set | `ACCEPTED` |
| `expiresAt < now` | `EXPIRED` |
| otherwise | `PENDING` |

A stored `status` column is a second source of truth that drifts from the
timestamps the moment one write path forgets to update it — the same reasoning
as `emailVerifiedAt` in §3.1. `auth.dto.js`'s sibling `invitation.dto.js` owns
this mapping.

**`role` must reject `OWNER`.** The Prisma `Role` enum contains `OWNER`, but
`frontend/src/types/workspace.ts` is explicit: *"Ownership is transferred, never
granted by invitation."* Enforce it in `invitation.validator.js` (a Joi
`valid('ADMIN','MEMBER')`) **and** re-check in the service — an invitation that
mints an owner is a privilege-escalation endpoint, and one layer of defence on
that is not enough.

**Seven days, because the copy already says so.** `DEAD_LINK.EXPIRED` on the
built accept screen reads *"Invitation links last seven days."* The backend
matches shipped copy, not the other way round.

### 3.7 Relationship map

```
                         ┌──────────────────┐
                         │      User        │
                         │  email (unique)  │
                         │  passwordHash?   │
                         │  emailVerifiedAt?│
                         └────────┬─────────┘
                                  │ 1
             ┌────────────┬───────┼────────────┬──────────────┐
             │ n          │ n     │ n          │ n            │ n
    ┌────────▼──────┐ ┌───▼─────┐ │ ┌──────────▼───────┐ ┌────▼────────┐
    │ OAuthAccount  │ │LoginCode│ │ │VerificationToken │ │RefreshToken │
    │ provider      │ │codeHash │ │ │ tokenHash        │ │ tokenHash   │
    │ providerAcctId│ │attempts │ │ │ purpose          │ │ familyId ───┼─┐
    │ @@unique(p,id)│ │expiresAt│ │ │ expiresAt        │ │ revokedAt   │ │
    └───────────────┘ └─────────┘ │ └──────────────────┘ │ replacedById├─┘
                                  │                      └─────────────┘
                                  │ n                     self-referencing
                          ┌───────▼──────┐                rotation chain
                          │  Membership  │  (existing — workspace roles)
                          └──────────────┘
```

Every child cascades on user delete. That is deliberate: a deleted user must not
leave a live refresh token behind.

---

## 4. Token architecture

### 4.1 The two tokens

| | Access token | Refresh token |
|---|---|---|
| Format | JWT, HS256 | opaque, 32 random bytes, base64url |
| TTL | **15 minutes** | **30 days** |
| Stored server-side | no — stateless | yes, **hashed** (`RefreshToken`) |
| Payload | `{ sub, email, emailVerified, iat, exp }` | none — it is a lookup key |
| Cookie | `tizello_access` | `tizello_refresh` |
| `Path` | `/` | **`/api/v1/auth/refresh`** |
| `SameSite` | `Lax` | `Strict` |
| Revocable before expiry | **no** | yes |

**Why the access token is stateless and therefore not revocable:** checking a
denylist on every request puts Redis or Postgres in the path of every single API
call. The 15-minute TTL is the bound on that trade — a revoked user keeps access
for at most 15 minutes. Logout and password reset both revoke the *refresh*
token, so the session dies at the next refresh at the latest.

**Why the refresh cookie is scoped to `Path=/api/v1/auth/refresh`:** the browser
then only ever attaches it to the one endpoint that consumes it. An XSS payload
fetching any normal API route cannot cause the refresh token to be sent, and
cannot read it either (httpOnly). This is the single highest-value line in the
whole design.

**Why `SameSite=Strict` on refresh but `Lax` on access:** `Lax` lets a
top-level navigation from an email link arrive already authenticated, which the
verify-email and reset-password flows need. The refresh cookie never rides a
cross-site navigation, so `Strict` costs nothing and removes a CSRF surface.

**`Secure` is derived from `NODE_ENV`** — on in production, off in development,
because `Secure` cookies are dropped over plain http and local dev is http.

### 4.2 The refresh flow

```
   access token expires (15m)
            │
            ▼
   any API call → 401 { data.code: "TOKEN_EXPIRED" }
            │
            ▼
   frontend fires  POST /api/v1/auth/refresh   (no body — the cookie IS the credential)
            │
            ├─ 1. read tizello_refresh cookie ────────── absent → 401 TOKEN_INVALID
            ├─ 2. sha256 → findUnique({ tokenHash }) ─── miss   → 401 TOKEN_INVALID
            ├─ 3. revokedAt != null ? ─────────────────► REUSE PATH (§4.3)
            ├─ 4. expiresAt < now ? ───────────────────► 401 TOKEN_EXPIRED
            │
            ├─ 5. ROTATE, in one transaction:
            │       old.revokedAt   = now
            │       old.replacedById = new.id
            │       insert new RefreshToken { same familyId, fresh 30d expiry }
            │
            ├─ 6. mint a new 15m access token
            └─ 7. Set-Cookie ×2 → 200 { user }
                        │
                        ▼
              frontend retries the original call
```

**Step order 3-before-4 is load-bearing.** If expiry is checked first, a stolen
token that has also expired reports "expired" and the reuse alarm never fires —
you lose the single clearest signal that a token was exfiltrated.

### 4.3 Reuse detection

Rotation alone does not detect theft; it only shortens the window. Detection
comes from the family:

```
  legitimate client          attacker (stole token T1)
        │                             │
        │                        uses T1 first
        │                             ├─ rotates → T2', attacker is now live
        │                             │
   uses T1 later                      │
        ├─ T1.revokedAt is set ───────┘
        ▼
  REUSE DETECTED
        └─ revoke EVERY token in familyId → both parties logged out
```

Being logged out is the correct response to a confirmed compromise: the
legitimate user re-authenticates and the attacker cannot, because they never had
the password. Without families you can only reject that one request and the
attacker keeps rotating forever.

**The concurrency trap — and the fix.** Two browser tabs whose access tokens
expire together both present the same valid refresh token. One rotates; the
second now presents a token with `revokedAt` set and trips the alarm, logging
out an innocent user. This is the single most common way a correct rotation
implementation gets reverted in production.

> **Grace window.** If a revoked token is presented within **10 seconds** of its
> `revokedAt` *and* it has a `replacedById`, return the already-issued
> replacement instead of tripping the alarm — an idempotent replay. Outside that
> window, treat it as reuse. Ten seconds is far longer than two tabs racing and
> far shorter than a useful attack window.

### 4.4 What revokes what

| Event | Effect |
|---|---|
| `POST /logout` | revoke the presented token's **family**; clear both cookies |
| `POST /reset-password` | revoke **every** family for the user (spec §9: *"Invalidate all sessions on password reset"*) |
| Reuse detected | revoke that family |
| User deleted | cascade drops every row |
| Access token | never revoked — expires in 15m (§4.1) |

### 4.5 `authGuard` must learn to read cookies

`src/shared/middlewares/auth.js` today reads only `Authorization: Bearer`. The
frontend sends cookies. Change it to **cookie first, Bearer fallback**:

```
tizello_access cookie  →  else  Authorization: Bearer  →  else 401
```

Keeping the Bearer path costs nothing and leaves the door open for a mobile
client or a server-to-server caller that has no cookie jar. Requires
`cookie-parser` mounted in `app.js` before the routes.

---

## 5. OAuth architecture (Passport)

### 5.1 Strategies

`passport`, `passport-google-oauth20`, `passport-github2`, registered in a new
**`src/config/passport.js`** — configuration, not business logic, so it sits
beside `db.js` and `redis.js` rather than inside the module.

**`session: false` on every strategy.** Passport's session support would install
a *second*, competing session mechanism next to our tokens. The strategy's only
job is to hand a verified provider profile to the service; we mint our own
tokens from it.

### 5.2 The `state` parameter

Passport's `state: true` option stores state in the session — which we do not
have. So we sign it ourselves: a **short JWT** carrying `{ next, nonce }` with a
10-minute expiry, verified on callback.

State is not optional. Without it the callback accepts any code the attacker can
get delivered, which is login-CSRF: the victim ends up silently signed in to the
*attacker's* account and everything they then do belongs to the attacker.

`next` rides inside the signed state rather than in a query parameter, so it
cannot be tampered with — and it is still re-checked against the same
same-origin-relative-path rule the frontend applies (`safeNextPath`), because a
signed open redirect is still an open redirect.

### 5.3 Account linking — the rule that must be right the first time

Spec §9: *"an OAuth identity whose verified email matches an existing account
**links to it** rather than creating a second account. Never link on an
unverified email — that is an account-takeover primitive."*

```
   provider callback → { provider, providerAccountId, email, emailVerified }
            │
   ┌────────▼─────────────────────────────────────┐
   │ OAuthAccount(provider, providerAccountId)?   │
   └────────┬─────────────────────────────────────┘
       found│                    │ not found
            ▼                    ▼
     sign in that user   ┌───────────────────────────┐
                         │ provider says email       │
                         │ verified?                 │
                         └───┬───────────────┬───────┘
                          no │               │ yes
                             ▼               ▼
                    ┌────────────────┐  ┌──────────────────────┐
                    │ REFUSE to link │  │ User with that email?│
                    │ 403            │  └───┬──────────────┬───┘
                    │ OAUTH_EMAIL_   │   no │              │ yes
                    │ UNVERIFIED     │      ▼              ▼
                    └────────────────┘  create User    LINK: insert
                                        emailVerifiedAt  OAuthAccount
                                          = now          → that user
                                        passwordHash
                                          = null
```

**Why refusing an unverified provider email matters:** if a provider let someone
sign up as `victim@example.com` without proving it, linking on that email hands
the attacker the victim's existing account. GitHub in particular will report
unverified addresses — the `user:email` scope is required, and the primary
address must be checked for `verified: true`. Google's `email_verified` claim
serves the same purpose.

**A brand-new OAuth user is created already verified** (`emailVerifiedAt = now`)
because the provider has vouched for the address. Sending them a verification
email would be asking them to prove something Google just proved.

### 5.4 Callback ends in a redirect, not JSON

The browser is mid-navigation, so the callback sets both cookies and issues a
`302` to `${CLIENT_ORIGIN}${next ?? '/board/sprint'}`. On failure it redirects to
`/sign-in?error=<code>` — the frontend maps the code to copy exactly as it does
for a form error. Rendering JSON here would leave the user staring at a raw
response body.

---

## 6. Invitation & membership architecture

This is where the two modules meet. An invited person **has no account**, so the
invitation link doubles as a registration entry point — and designing the two
halves separately produces the deadlock in §6.4.

### 6.1 The flow

```
  ADMIN SIDE                          RECIPIENT SIDE
  ──────────                          ──────────────
  POST /workspaces/:id/invitations
   { email, role }
        │  requirePermission(MEMBER_INVITE)  → OWNER, ADMIN only
        │
        ├─ mint 32 random bytes → token
        ├─ store SHA-256(token), expiresAt = now + 7d
        └─ enqueue `send-invitation`  (BullMQ — never send inline)
                    │
                    ▼
        email: {CLIENT_ORIGIN}/invite/<token>
                    │
                    ▼
        recipient clicks ────────► GET /api/v1/invitations/:token   « PUBLIC »
                                        │
                        ┌───────────────┼────────────────┐
                    200 VALID       410 EXPIRED      404 UNKNOWN
                        │                                (revoked /
                        │                                 declined /
                        │                                 already used /
                        │                                 never existed)
                        ▼
                 signed in?
            ┌───────┴────────┐
        yes │                │ no
            ▼                ▼
   POST /invitations/    /sign-in?next=/invite/<token>
     :token/accept       /sign-up?next=/invite/<token>
            │                │
            │                └─ register WITH inviteToken (§6.4)
            │                        │  auto-verifies the email
            │                        ▼
            │                   signed in, back on /invite/<token>
            │                        │
            └────────────┬───────────┘
                         ▼
            transaction:  Membership{userId, workspaceId, role}
                          Invitation.acceptedAt   = now
                          Invitation.acceptedById = userId
                         ▼
                  302 → /workspaces/:workspaceId
```

### 6.2 The invitation is bound to one address

Only an account whose **verified** email equals `Invitation.email` may accept.

This is an emailed, per-address invitation — not a shareable "anyone with the
link can join" join-link, which is a different feature with different rules. The
token went to exactly one mailbox, so exactly one identity should be able to
redeem it. Without the binding, a forwarded email, a shared screenshot, or a
breach at the recipient's mail provider is a workspace intrusion.

| Situation | Response |
|---|---|
| signed-in email **==** invited email, verified | accept |
| signed-in email **≠** invited email | `403 INVITE_EMAIL_MISMATCH` |
| signed-in email == invited email, **unverified** | `403 EMAIL_NOT_VERIFIED` |
| already a member of that workspace | `200`, no-op — see §6.5 |

> **Frontend gap.** `INVITE_EMAIL_MISMATCH` has no copy and is not in the closed
> `AuthErrorCode` union in `frontend/src/types/auth.ts`. The trap is ordinary —
> signed in as `bob@personal.com`, invited as `bob@work.com` — and silently
> failing there is a dead end. Add the code and a message along the lines of
> *"This invitation was sent to a different address. Sign in as {email} to
> accept."* Naming the invited address is safe: whoever holds the token was
> already told it by the email itself.

### 6.3 Accepting an invitation verifies the email — for free

The token was **delivered to that address**. Possession of it proves control of
the mailbox, which is precisely what the verification email proves. So when the
accepting account's email matches the invited address, set
`emailVerifiedAt = now` if it is still null.

This is the same reasoning already applied to OAuth in §5.3: the provider
vouched for the address, so we do not ask the user to prove it a second time.
Here the proof is our own email, which is stronger.

**It only holds when the addresses match.** Registering as `bob@personal.com`
from an invitation sent to `bob@work.com` proves nothing about either address.

### 6.4 The deadlock — and why `inviteToken` on register is required

Run the pieces as separately specified and the flow locks up:

```
  1. Bob is invited, has no account
  2. Bob clicks the link → /invite/<token> → not signed in
  3. Bob follows "Create an account" → /sign-up?next=/invite/<token>
  4. POST /auth/register → 201, emailVerifiedAt = null
        (spec §6.1: "On success → redirect to /verify-email?pending=1 …
         The account exists but is unverified." No session is issued.)
  5. Bob tries to sign in → 403 EMAIL_NOT_VERIFIED   (spec §9)
  6. Bob cannot reach the accept screen.
     He is waiting on a verification email — which, until a mail transport
     exists (§13.5), never arrives.
```

Step 5 is not a bug in either half. Registration correctly leaves an account
unverified; login correctly refuses an unverified account. **The two are only
wrong together**, and only on the invite path.

> **Resolution: `POST /auth/register` accepts an optional `inviteToken`.**
> When present and valid, and when the registered email matches the invitation's
> address, registration runs as one transaction: create the user with
> `emailVerifiedAt = now` (§6.3), create the membership, mark the invitation
> accepted, and **issue the session immediately** — the invited user lands
> straight in the workspace with no verification round-trip at all.

That makes `inviteToken` a **requirement, not a convenience**. Without it the
invite path cannot complete. This is the single most important finding in this
document and the reason the two modules are planned together.

A mismatched or dead `inviteToken` must **not** fail the registration — create
the account normally and return `data.inviteApplied: false`. Losing an account
because an invitation expired mid-signup is a worse outcome than an extra click.

### 6.5 Accept must be idempotent

`Membership` carries `@@unique([userId, workspaceId])`. A double-clicked Accept,
or a retry after a dropped response, hits it and Prisma raises `P2002` → the
error middleware turns that into a `409`. The user sees a failure for an
operation that in fact succeeded.

Accept therefore reads: *if a membership already exists, return `200` with it*
— and mark the invitation accepted anyway if it is still pending. The whole
thing runs inside `prisma.$transaction` so a crash between the two writes cannot
leave a membership with a still-pending invitation, or the reverse.

The same reasoning applies at invite time: inviting someone who is already a
member returns `409 ALREADY_MEMBER` rather than creating a token that can only
ever be a no-op.

### 6.6 Dead invitations all look the same

`frontend/src/types/workspace.ts` gives the lookup exactly three outcomes:

```ts
type InvitationLookup =
  | { status: "VALID"; invitation: WorkspaceInvitation }
  | { status: "EXPIRED" }
  | { status: "UNKNOWN" };
```

So **revoked, declined and already-accepted invitations all return `404`**, not
codes of their own. The shipped copy for `UNKNOWN` already covers all three —
*"The link may be mistyped, cancelled, or already used."* Inventing a fourth
state the frontend cannot render would break the page rather than inform it.

Only genuine expiry gets `410`, because that state has its own copy and its own
remedy (*"Ask whoever invited you to send a fresh one."*).

There is a second reason to collapse them: distinguishing *revoked* from *never
existed* tells a token-guessing attacker that a token was once real.

### 6.7 The public endpoint, and what it may say

`GET /api/v1/invitations/:token` is **unauthenticated by necessity** — the
recipient has no account yet. That makes it the only route in either module that
returns workspace data to an anonymous caller, so its response is capped at what
the invitation email already revealed:

```
{ token, workspaceId, workspaceName, invitedByName, role }
```

No member list, no member count, no inviter email, no workspace settings. It
matches `WorkspaceInvitation` in the frontend types exactly, and that shape is
the ceiling, not a starting point.

### 6.8 Which module owns this

A separate **`invitation`** module (six files, per module-consistency) rather
than folding it into `auth` or a `member` module:

- it has its own lifecycle, its own token policy, its own rate limits, and the
  only public unauthenticated route outside `auth`;
- listing the roster, changing a role and removing a member are a different
  concern and belong in a later `member` module;
- `auth` is about proving who you are. This is about what you may join.

**Deliberate divergence to record in `docs/api/invitation.md` §1:**
`invitation.repository.js` writes `Membership` rows, a table it does not
otherwise own. Accepting is one atomic business operation — membership created,
invitation closed — and splitting it across two repositories would put the
transaction boundary in the wrong place. The rule is one repository per module,
not one table per module.

### 6.9 Route shapes: two different scopes

| Scope | Path shape | Why |
|---|---|---|
| admin | `/workspaces/:workspaceId/invitations…` | `requirePermission` resolves the caller's membership from `(userId, workspaceId)`, so the workspace **must** be in the path |
| recipient | `/invitations/:token…` | there is no workspace context yet — the token *is* the context |

---

## 7. Endpoint contract

Base path `/api/v1/auth`. Every response goes through `ApiResponse`; every error
carries `data.code` from the frontend's closed union (§2.2).

| # | Method | Path | Guard | Limiter | Success | Failure codes |
|---|---|---|---|---|---|---|
| 1 | POST | `/register` | — | 5/hr | `201 { user }` — **+ cookies when `inviteToken` applied** (§6.4) | `EMAIL_TAKEN` 409, `WEAK_PASSWORD` 422 |
| 2 | POST | `/login` | — | 10/15m | `200 { user }` + cookies | `INVALID_CREDENTIALS` 401, `EMAIL_NOT_VERIFIED` 403 |
| 3 | POST | `/login/request-code` | — | 5/hr | **`202` always** | `RATE_LIMITED` 429 |
| 4 | POST | `/login/verify-code` | — | 10/15m | `200 { user }` + cookies | `CODE_INVALID` 401, `CODE_EXPIRED` 410 |
| 5 | POST | **`/refresh`** | — | 60/15m | `200 { user }` + rotated cookies | `TOKEN_INVALID` 401, `TOKEN_EXPIRED` 401 |
| 6 | POST | `/logout` | — | — | `204` + cookies cleared | — |
| 7 | GET | `/session` | `authGuard` | — | `200 { user }` | `401` |
| 8 | POST | `/verify-email` | — | 10/15m | `200 { user }` | `TOKEN_INVALID` 400, `TOKEN_EXPIRED` 410 |
| 9 | POST | `/resend-verification` | — | 3/hr | **`202` always** | `RATE_LIMITED` 429 |
| 10 | POST | `/forgot-password` | — | 5/hr | **`202` always** | `RATE_LIMITED` 429 |
| 11 | POST | `/reset-password` | — | 10/15m | `200` | `TOKEN_INVALID` 400, `TOKEN_EXPIRED` 410, `WEAK_PASSWORD` 422 |
| 12 | GET | `/oauth/:provider/start` | — | 20/15m | `302` to provider | — |
| 13 | GET | `/oauth/:provider/callback` | — | 20/15m | `302` + cookies | `302 /sign-in?error=…` |

**`/logout` takes no guard on purpose.** Logging out with an already-expired
access token must still clear the cookies — a 401 there strands the user in a
state they cannot leave.

**`/refresh` gets a looser limiter (60/15m)** than login: it is a legitimate
background call every 15 minutes across however many tabs are open, not a
credential guess.

### 7.1 Invitation endpoints

Two scopes (§6.9). Admin routes are workspace-scoped; recipient routes are
token-scoped.

| # | Method | Path | Guard | Limiter | Success | Failure codes |
|---|---|---|---|---|---|---|
| 14 | POST | `/workspaces/:workspaceId/invitations` | `authGuard` + `requirePermission(MEMBER_INVITE)` | 50/hr per workspace | `201 { invitation }` | `ALREADY_MEMBER` 409, `INVITE_PENDING` 409, `INVALID_ROLE` 422 |
| 15 | GET | `/workspaces/:workspaceId/invitations` | `authGuard` + `requirePermission(MEMBER_VIEW)` | — | `200 { invitations[] }` | `403` |
| 16 | DELETE | `/workspaces/:workspaceId/invitations/:id` | `authGuard` + `requirePermission(MEMBER_INVITE)` | — | `204` (sets `revokedAt`) | `404` |
| 17 | POST | `/workspaces/:workspaceId/invitations/:id/resend` | `authGuard` + `requirePermission(MEMBER_INVITE)` | 10/hr per workspace | `202` | `404`, `410` |
| 18 | GET | **`/invitations/:token`** | **none — public (§6.7)** | 30/15m per IP | `200 { invitation }` | `410` expired, `404` everything else (§6.6) |
| 19 | POST | `/invitations/:token/accept` | `authGuard` | 20/15m | `200 { membership }` | `INVITE_EMAIL_MISMATCH` 403, `EMAIL_NOT_VERIFIED` 403, `410`, `404` |
| 20 | POST | `/invitations/:token/decline` | `authGuard` | 20/15m | `204` (sets `declinedAt`) | `404` |

**Revoke is `DELETE` but does not delete.** It sets `revokedAt`. The verb
describes what the admin is doing to the invitation, not what happens to the
row — and §3.6 keeps the row because the audit trail is the point.

**Resend re-uses the row, and mints a new token.** Re-issuing the same token
would mean a link the admin believes they replaced still works. Rotate the hash,
push `expiresAt` out another 7 days, re-enqueue the job.

**#15 returns pending invitations only** — the members screen shows outstanding
invites next to the roster, not a history log. The derived status (§3.6) filters
it.

### 7.2 Endpoints that must lie

| Endpoint | Answers | Why |
|---|---|---|
| `/login/request-code` | `202` for unknown addresses | otherwise it is an oracle for "is this email registered" |
| `/forgot-password` | `202` for unknown addresses | same |
| `/resend-verification` | `202` for unknown addresses | same |
| `/login` | `INVALID_CREDENTIALS` for both "no account" and "wrong password" | spec §8: *"the pair is the enumeration defence and must not be split"* |

All three `202` paths must **pad response time to a constant** — an endpoint that
returns in 8ms for an unknown address and 95ms for a real one (because it hashed
a password and queued an email) has leaked exactly what the status code hid.

`/register` returning `EMAIL_TAKEN` **is** an enumeration leak, and spec §8
accepts it deliberately: sign-up cannot usefully hide it, and the alternative
(silently emailing the existing owner) is worse. Rate limiting is the mitigation.

---

## 8. Rate limiting

Add to `src/shared/middlewares/rateLimiter.js` — no route invents its own window.

| Limiter | Window / max | Endpoints | Why |
|---|---|---|---|
| `authLimiter` *(exists)* | 15 min / 10 | login, verify-code, verify-email, reset-password | matches spec §9 |
| `registerLimiter` | 1 hr / 5 | register | account-creation spam, and it is the one enumeration leak we accept |
| `recoveryLimiter` | 1 hr / 5 | forgot-password, request-code | each one sends an email to a third party |
| `resendLimiter` | 1 hr / 3 | resend-verification | tightest — pure email amplification |
| `refreshLimiter` | 15 min / 60 | refresh | a background call, not a guess |
| `oauthLimiter` | 15 min / 20 | oauth start + callback | — |
| `inviteSendLimiter` | 1 hr / 50 **per workspace** | create + resend invitation | an admin mass-inviting sends mail from *our* domain to strangers; this is the spam-reputation guard, and it is keyed on the workspace because that is the unit doing the sending |
| `inviteLookupLimiter` | 15 min / 30 per IP | `GET /invitations/:token` | tokens are 256-bit so guessing is infeasible; this stops scanning traffic rather than a real attack |
| `inviteActionLimiter` | 15 min / 20 | accept + decline | — |

**Keyed per IP *and* per email.** IP alone lets one attacker spread guesses
across a botnet; email alone lets one IP walk a user list. The `keyGenerator`
must normalize the email itself (lowercase + trim) — the limiter runs *before*
the validator, so it cannot rely on `req.body` having been normalized yet.

**Redis-backed, and it must fail closed.** With the default in-memory store every
process keeps its own counter, so the real limit is `max × instances` and it
resets on deploy. If Redis is unreachable, reject rather than allow: an auth
limiter that fails open is not a limiter.

---

## 9. Failure modes

The table most worth having during an incident.

| Condition | Behaviour | Why |
|---|---|---|
| Redis down | rate limiters **fail closed** → 429 | an auth limiter that fails open is decorative |
| Mail queue (BullMQ) down | register/forgot still return normally; job retries | the account was created; the email is eventually-consistent by design |
| Provider (Google/GitHub) unreachable | `302 /sign-in?error=SERVER_ERROR` | never a raw stack in the browser |
| Postgres down | 500 generic; the global handler logs the real error | [error-handling](../rules/error-handling.md) — never leak driver messages |
| Refresh token valid, user deleted | 401 + clear cookies | cascade already removed the row; this is the belt-and-braces path |
| Clock skew between instances | ±60s `clockTolerance` on `jwt.verify` | otherwise a 15m token is randomly rejected near expiry |
| Mail transport absent (today) | invitation is created; the link is only in the worker log | the invite flow is testable end-to-end **only** by copying the token from the log until §13.5 is resolved |
| Workspace deleted with invites outstanding | cascade removes the rows; the link then 404s | §6.6 — an invite to a workspace that no longer exists is indistinguishable from one that never existed, correctly |
| Accept races a revoke | the transaction reads the row `FOR UPDATE`; whichever commits first wins | without the lock both can succeed and a revoked invitation still grants membership |

---

## 10. Files to create and change

Six module files, per [module-consistency](../skills/module-consistency/SKILL.md).

```
src/modules/auth/
  auth.controller.js    read req, call service, respond via ApiResponse
  auth.service.js       business rules; throws AppError; hashing; linking
  auth.repository.js    every Prisma call in the module
  auth.routes.js        endpoints, guards, validators, limiters
  auth.dto.js           row → { id, name, email, emailVerified, createdAt }
  auth.validator.js     Joi schemas + email normalization
```

And the second module, same six files:

```
src/modules/invitation/
  invitation.controller.js
  invitation.service.js       invite / accept / decline / revoke / resend
  invitation.repository.js    Prisma — including the Membership write (§6.8)
  invitation.routes.js        two route shapes, workspace- and token-scoped (§6.9)
  invitation.dto.js           row → { token, workspaceId, workspaceName,
                              invitedByName, role } and the derived status (§3.6)
  invitation.validator.js     email normalization; role restricted to ADMIN|MEMBER
```

New shared code:

| File | Holds |
|---|---|
| `src/config/passport.js` | Google + GitHub strategy registration, `session: false` |
| `src/shared/utils/tokens.js` | sign/verify access JWT, mint opaque refresh, sha256, 6-digit code |
| `src/shared/utils/cookies.js` | set/clear both cookies in exactly one place |
| `src/shared/constants/authCodes.js` | the `AuthErrorCode` union, mirroring `frontend/src/types/auth.ts`, **plus** `INVITE_EMAIL_MISMATCH`, `ALREADY_MEMBER`, `INVITE_PENDING` |

Changed:

| File | Change |
|---|---|
| `prisma/schema.prisma` | `User.emailVerifiedAt` + 5 new models + 3 enums + the `Invitation` rework (§3.6) |
| *migration SQL* | the partial unique index on live invitations — raw SQL, Prisma cannot express it (§3.6) |
| `src/shared/middlewares/auth.js` | cookie-first, Bearer fallback (§4.5) |
| `src/shared/middlewares/rateLimiter.js` | 5 new limiters + Redis store |
| `src/app.js` | mount `cookie-parser` and `passport.initialize()` |
| `src/routes/index.js` | two lines: `/api/v1/auth` and `/api/v1` for the invitation routes, kept alphabetical |
| `src/workers/email.worker.js` | the `send-invitation` handler must now email the **raw token** captured at mint time — it can no longer read it back, because only the hash is stored (§3.6) |
| `docs/api/invitation.md` | the second contract doc |
| `src/queues/email.queue.js` | job names: `send-verification`, `send-reset`, `send-login-code` |
| `src/workers/email.worker.js` | handlers for the three new job types |
| `docs/api/auth.md` | **the contract doc — written alongside the code, not after** |

New dependencies: `passport`, `passport-google-oauth20`, `passport-github2`,
`cookie-parser`, `rate-limit-redis`.
`bcrypt`, `jsonwebtoken`, `joi`, `ioredis`, `bullmq` are already installed —
spec §9 allows *"argon2id, or bcrypt cost ≥ 12"*, so **bcrypt at cost 12** meets
it with no new dependency.

### 10.1 One anticipated divergence

`auth.service.js` carries password auth, code auth, token rotation *and* OAuth
linking. It will be the largest service in the backend. If it passes ~400 lines,
split the OAuth half into `auth.oauth.service.js` and **record it in
`docs/api/auth.md` §1 as a deliberate divergence** from the six-file rule. The
rule exists to prevent drift, not to force one unreadable file — but an
undocumented seventh file is exactly the drift it targets.

---

## 11. Environment variables

Add to `.env.example` and `REQUIRED_ENV_VARS` in `src/config/env.js`.

| Var | Default | Purpose |
|---|---|---|
| `JWT_SECRET` *(exists)* | — | signs the access token |
| `JWT_EXPIRY` *(exists)* | `15m` | access token TTL |
| `REFRESH_TOKEN_TTL_DAYS` | `30` | refresh token TTL |
| `LOGIN_CODE_TTL_MINUTES` | `10` | spec §9 |
| `LOGIN_CODE_MAX_ATTEMPTS` | `5` | spec §9 |
| `EMAIL_VERIFY_TTL_HOURS` | `24` | spec §9 |
| `PASSWORD_RESET_TTL_HOURS` | `1` | spec §9 |
| `BCRYPT_COST` | `12` | spec §9 minimum |
| `INVITE_TTL_DAYS` | `7` | must match the shipped copy *"Invitation links last seven days"* (§3.6) |
| `INVITE_MAX_PER_WORKSPACE_HOUR` | `50` | the spam-reputation guard (§8) |
| `COOKIE_DOMAIN` | *unset* | unset = host-only, correct for local dev |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | — | required only if Google is enabled |
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` | — | required only if GitHub is enabled |
| `OAUTH_CALLBACK_BASE_URL` | `http://localhost:5000` | must match the provider console exactly |

OAuth credentials are **not** in `REQUIRED_ENV_VARS`: a developer without Google
keys should still be able to boot and work on password auth. Register a strategy
only when its pair is present, and let `/oauth/google/start` 404 otherwise —
failing at the endpoint is better than refusing to start.

### 11.1 Cross-origin cookies — check this before debugging anything else

Frontend `:3000`, backend `:5000`. Different **origins**, but the same
**site** — `SameSite=Lax` is about site, not origin, and the port is not part of
a site. So cookies work in local dev.

Requirements either way:
- frontend `fetch` must send `credentials: 'include'`
- `cors({ origin: config.clientOrigin, credentials: true })` — already correct in
  `app.js`. It must never become `origin: '*'`; browsers reject wildcard origins
  on credentialed requests.
- In production: if the frontend and API share a registrable domain
  (`app.tizello.com` / `api.tizello.com`) `Lax` still works. If they are on
  genuinely different domains, both cookies need `SameSite=None; Secure` — and
  `None` re-opens the CSRF surface that `Strict` was closing on the refresh
  cookie, so prefer a shared parent domain.

---

## 12. Build order

Each step leaves the tree working and testable.

| # | Step | Done when |
|---|---|---|
| 1 | Schema + migration | `prisma migrate dev --name auth` applies; `npx prisma studio` shows the tables |
| 2 | `tokens.js`, `cookies.js`, `authCodes.js` | unit-level: sign → verify round-trips; sha256 is stable |
| 3 | Register + verify-email + `/session` | can create an account and read it back with a cookie |
| 4 | Password login + logout | full password round-trip |
| 5 | **Refresh + rotation + reuse detection** | replaying an old token revokes the family; two tabs do **not** log each other out |
| 6 | `authGuard` cookie support | an existing guarded route accepts a cookie |
| 7 | Login codes | code-first sign-in works; 6th wrong attempt burns the code |
| 8 | Forgot / reset password | reset revokes every session |
| 9 | Passport Google | link + create both work; unverified email is refused |
| 10 | Passport GitHub | same, with the `user:email` scope |
| 11 | Rate limiters on Redis | limits hold across two running instances |
| 12 | `docs/api/auth.md` | written **alongside** steps 3-10, per the skill — not at the end |
| 13 | `Invitation` rework + partial index | migration applies; re-inviting a removed member no longer 409s |
| 14 | Invite / list / revoke / resend | an admin can send and cancel; the pending list drives the members screen |
| 15 | `GET /invitations/:token` | the built accept screen renders VALID / EXPIRED / UNKNOWN against real data |
| 16 | Accept + decline | idempotent (§6.5); email binding enforced (§6.2); membership appears |
| 17 | **`inviteToken` on register** | the deadlock (§6.4) is gone — invited user goes from link to workspace without a verification email |
| 18 | `docs/api/invitation.md` | alongside 13-17 |
| 19 | Frontend swap | `lib/auth.ts` + `demo-invites.ts` → `fetch`; OAuth path (§2.3); add `INVITE_EMAIL_MISMATCH` copy (§6.2) |

Step 5 before step 7 is deliberate: rotation is the part most likely to need
rework, and every later flow issues tokens through it.

Steps 13-17 come after the whole of auth because every one of them needs a
signed-in caller — except step 15, which is the one public route and can be
tested first if the invite flow is being worked on in parallel. **Step 17 is the
one that makes the feature actually usable**; 14-16 alone leave an invited
stranger unable to sign in.

---

## 13. Open questions — decide before step 1

1. **Cookies-only, or also return the access token in the body?** This plan says
   cookies-only, matching spec §9's XSS guarantee. A future mobile client would
   want the body form. Adding it later is additive; removing it later is not.
2. **`emailVerifiedAt` vs the frontend's boolean** — confirmed above that the DTO
   maps it. Flagged only because it means the DB and the wire deliberately differ.
3. **Is `/board/sprint` still the post-OAuth landing route?** Taken from
   `frontend/src/lib/session-cookie.ts` `BOARD_HOME`. Confirm it has not moved.
4. **Does an OAuth-only user ever need a password?** If yes, `/forgot-password`
   on a `passwordHash: null` account becomes a *set*-password flow. This plan
   returns the standard `202` and sends nothing, which is safe but silent.
5. **Login-code and invitation delivery.** There is no mail transport yet —
   `email.worker.js` still has a `TODO` where the send goes. Until one exists,
   steps 3, 7, 8 and 14-17 are testable only by reading the token out of the
   worker log. This is the single biggest blocker on the invite feature being
   demonstrable.
6. **Does an invitation survive the invited person changing their email?** This
   plan binds on the address at invite time (§6.2). If someone is invited at
   `bob@work.com` and then changes their Tizello email, the invitation stops
   being acceptable. Correct, but worth confirming it is the wanted behaviour.
7. **Should a *second* workspace invitation to an existing member be allowed to
   change their role?** Today it is `409 ALREADY_MEMBER` (§6.5). Promoting a
   member is a role-update operation and belongs in the future `member` module,
   not in an invitation — but that means an admin's instinct ("just re-invite
   them as ADMIN") returns an error until that module exists.
8. **Shareable join links** — "anyone with this link can join" — are a
   *different* feature with different rules (no address binding, a reusable
   token, usually a member cap). Out of scope here; §6.2 would not survive being
   stretched to cover it.
