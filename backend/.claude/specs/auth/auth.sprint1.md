# Sprint 1 — Foundation: schema, migration, token utilities

**Plan steps:** 1–2 · **Blocks:** every other sprint · **Depends on:** nothing

## Goal

The database can hold everything auth and invitations need, and the primitives
that mint and verify tokens exist and are tested. No endpoint ships this sprint.

## Tasks

### 1.1 Schema — `prisma/schema.prisma`

- [ ] `User`: add `emailVerifiedAt DateTime?`. **Not a boolean** — plan §3.1.
- [ ] `enum OAuthProvider { GOOGLE GITHUB }`
- [ ] `enum TokenPurpose { EMAIL_VERIFY PASSWORD_RESET }`
- [ ] `model OAuthAccount` — `@@unique([provider, providerAccountId])`, §3.2
- [ ] `model RefreshToken` — `tokenHash` unique, `familyId`, `replacedById`,
      `revokedAt`, `userAgent`, `ip`; index on `userId`, `familyId`, `expiresAt`, §3.3
- [ ] `model LoginCode` — `codeHash`, `attempts`, `expiresAt`, `consumedAt`, §3.4
- [ ] `model VerificationToken` — `tokenHash` unique, `purpose`, index on
      `[userId, purpose]`, §3.5
- [ ] `Invitation` rework: `token` → `tokenHash`; add `declinedAt`, `revokedAt`,
      `acceptedById` + the `InvitationAcceptedBy` relation; **drop** the
      unconditional `@@unique([email, workspaceId])`; add `@@index([email])`, §3.6
- [ ] Every child relation cascades on user delete — a deleted user must not
      leave a live refresh token behind.

### 1.2 The partial unique index — raw SQL

Prisma's DSL cannot express a partial unique index, so it is hand-written into
the generated migration:

```sql
CREATE UNIQUE INDEX invitations_live_email_workspace
  ON invitations (email, "workspaceId")
  WHERE "acceptedAt" IS NULL
    AND "declinedAt" IS NULL
    AND "revokedAt"  IS NULL;
```

- [ ] `npx prisma migrate dev --name auth_and_invitations`
- [ ] Paste the SQL into the generated migration **before** applying it
- [ ] Re-run and confirm it applied

### 1.3 `src/shared/utils/tokens.js`

- [ ] `signAccessToken(user)` → JWT, HS256, `config.jwtExpiry`, payload
      `{ sub, email, emailVerified }`
- [ ] `verifyAccessToken(token)` → decoded, `clockTolerance: 60` (§9 failure table)
- [ ] `mintOpaqueToken()` → 32 CSPRNG bytes, base64url (URL-safe: invitation
      tokens ride in a path segment)
- [ ] `hashToken(raw)` → SHA-256 hex. **Not bcrypt** — 256 bits of entropy has
      nothing to brute-force and refresh runs on every access-token expiry, §3.3
- [ ] `mintLoginCode()` → 6 digits, `crypto.randomInt`, zero-padded
- [ ] `hashLoginCode` / `verifyLoginCode` → **bcrypt**, because 10⁶ is
      enumerable under SHA-256 in milliseconds, §3.4

### 1.4 `src/shared/utils/cookies.js`

- [ ] `setAuthCookies(res, { accessToken, refreshToken })`
- [ ] `clearAuthCookies(res)`
- [ ] Access: `tizello_access`, `httpOnly`, `sameSite: 'lax'`, `path: '/'`, 15m
- [ ] Refresh: `tizello_refresh`, `httpOnly`, `sameSite: 'strict'`,
      **`path: '/api/v1/auth/refresh'`**, 30d
- [ ] `secure` derived from `NODE_ENV === 'production'` — `Secure` cookies are
      dropped over plain http and local dev is http
- [ ] Both cookies cleared with the **same** path/sameSite they were set with,
      or the browser silently keeps them

### 1.5 `src/shared/constants/authCodes.js`

- [ ] Mirror the closed union in `frontend/src/types/auth.ts`
- [ ] Plus `INVITE_EMAIL_MISMATCH`, `ALREADY_MEMBER`, `INVITE_PENDING`,
      `OAUTH_EMAIL_UNVERIFIED`

### 1.6 Config

- [ ] `src/config/env.js`: read the new vars added to `.env` this sprint.
      OAuth pairs stay **out** of `REQUIRED_ENV_VARS`, §11.

## Definition of done

- [ ] `npx prisma migrate dev` applies against the live database
- [ ] `npx prisma studio` shows `oauth_accounts`, `refresh_tokens`,
      `login_codes`, `verification_tokens`, and the reworked `invitations`
- [ ] The partial index exists: `\d invitations` in psql lists
      `invitations_live_email_workspace ... WHERE ...`
- [ ] Sign → verify round-trips; `hashToken` is stable across calls
- [ ] `npm run dev` still boots and `/health` answers

## Traps

- **The refresh cookie's `path` is the single highest-value line in the design**
  (§4.1). Getting it wrong silently widens the XSS blast radius and nothing
  fails visibly.
- Applying the migration before pasting the raw SQL means a second migration to
  add it. Harmless, but check it landed either way.
