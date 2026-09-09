# Sprint 3 — Refresh rotation and reuse detection

**Plan steps:** 5–6 · **Depends on:** sprint 2 · **Blocks:** 4, 5

> The trickiest sprint in the project, and deliberately early: every later flow
> issues tokens through this code, so reworking it later is expensive.

## Goal

An expired access token is renewed without re-authenticating, a stolen refresh
token is detected and kills the session, and two browser tabs do **not** log
each other out.

## Tasks

### 3.1 `POST /api/v1/auth/refresh`

No request body — the cookie *is* the credential.

- [ ] Read `tizello_refresh`; absent → `401 TOKEN_INVALID`
- [ ] SHA-256 → `findUnique({ tokenHash })`; miss → `401 TOKEN_INVALID`
- [ ] **`revokedAt` checked BEFORE `expiresAt`** — §4.2. Reversed, a stolen
      token that also expired reports "expired" and the theft alarm never fires
- [ ] Expired → `401 TOKEN_EXPIRED`
- [ ] Rotate inside **one** `prisma.$transaction`:
      old `revokedAt = now`, old `replacedById = new.id`, insert the new row
      with the **same `familyId`** and a fresh 30-day expiry
- [ ] Mint a new access token; set both cookies; `200 { user }`

### 3.2 Reuse detection

- [ ] A revoked token presented outside the grace window ⇒ **revoke every row
      sharing its `familyId`** and return `401`
- [ ] `req.log.warn({ userId, familyId }, 'refresh token reuse detected')` —
      this is the clearest signal of exfiltration the system produces

### 3.3 The grace window — do not skip this

Two tabs whose access tokens expire together both present the same valid refresh
token. One rotates; the second now looks like reuse and logs out an innocent
user. **This is the most common reason a correct rotation implementation gets
reverted in production.**

- [ ] A revoked token presented within **10 seconds** of its `revokedAt`, whose
      `replacedById` is set, returns the **already-issued replacement** —
      an idempotent replay, not an alarm
- [ ] Outside the window it is reuse

### 3.4 `authGuard` learns cookies — `src/shared/middlewares/auth.js`

- [ ] `tizello_access` cookie **first**, `Authorization: Bearer` as fallback
- [ ] Keep the Bearer path: it costs nothing and leaves the door open for a
      mobile or server-to-server client with no cookie jar
- [ ] `clockTolerance: 60` on verify — otherwise a 15-minute token is randomly
      rejected near expiry across instances with drifting clocks
- [ ] Expired token → `401` with `data.code: 'TOKEN_EXPIRED'`, which is the
      signal the frontend uses to decide to call `/refresh`

### 3.5 Revocation matrix (§4.4)

- [ ] logout → revoke that family
- [ ] reuse detected → revoke that family
- [ ] password reset → revoke **every** family for the user (sprint 4)
- [ ] access token → never revoked; 15 minutes is the bound on that trade

## Definition of done

- [ ] Refresh returns a new access cookie and a **different** refresh cookie
- [ ] The old refresh token is `revokedAt` with `replacedById` set
- [ ] Replaying a rotated token **after 10s** revokes the family and 401s
- [ ] Replaying it **within 10s** returns the same replacement — no alarm
- [ ] **Two parallel refreshes with the same cookie both succeed** (the tab race)
- [ ] A guarded route accepts the cookie with no `Authorization` header
- [ ] After logout, refresh 401s

## Traps

- Rotation outside a transaction can leave the old row revoked and no new row
  written — the user is logged out by a crash.
- The grace window must key on `replacedById`, not just on time; a revoked token
  with no replacement is a logout, not a race.
