# Sprint 2 — Account lifecycle: register, verify, session, login, logout

**Plan steps:** 3–4 · **Depends on:** sprint 1 · **Blocks:** 3, 4, 5, 8

## Goal

An account can be created, its email proved, and a session opened and closed
with a password. The `auth` module exists as six files.

## Tasks

### 2.1 Module skeleton — `src/modules/auth/`

- [ ] All six files, from `templates/module/` in the backend-scaffold skill
- [ ] Mount in `src/routes/index.js` — one line, never an edit to `app.js`
- [ ] `app.js`: mount `cookie-parser` **before** the routes

### 2.2 `POST /api/v1/auth/register`

- [ ] Validator: `name` 2–80, `email` ≤254 + **lowercased and trimmed, written
      back to `req.body`**, `password` 8–128
- [ ] Service: reject a known-common password → `422 WEAK_PASSWORD`
- [ ] bcrypt at `config.bcryptCost` (12)
- [ ] Mint an `EMAIL_VERIFY` token (24h), store the **hash**, enqueue
      `send-verification` with the **raw** token
- [ ] `201 { user }` — **no session**, per spec §6.1. The frontend redirects to
      `/verify-email?pending=1`
- [ ] Duplicate email → `409 EMAIL_TAKEN`. This is an accepted enumeration leak
      (spec §8); rate limiting is the mitigation, not secrecy

### 2.3 `POST /api/v1/auth/verify-email`

- [ ] Look up by `tokenHash` **and `purpose: EMAIL_VERIFY`** — plan §3.5. A
      token minted for one purpose must never be redeemable at the other
- [ ] Consumed or missing → `400 TOKEN_INVALID`; expired → `410 TOKEN_EXPIRED`
- [ ] Set `emailVerifiedAt`, set `consumedAt`, return `200 { user }`

### 2.4 `POST /api/v1/auth/resend-verification`

- [ ] **`202` always**, including for addresses with no account
- [ ] Pad response time to a constant — an endpoint that returns in 8ms for an
      unknown address and 95ms for a real one has leaked what the status hid

### 2.5 `POST /api/v1/auth/login`

- [ ] Wrong password **and** no such account both → `401 INVALID_CREDENTIALS`.
      Spec §8: *"the pair is the enumeration defence and must not be split"*
- [ ] Compare the hash even when the user does not exist (a dummy hash), or the
      timing difference re-creates the oracle the shared message removes
- [ ] `emailVerifiedAt === null` → `403 EMAIL_NOT_VERIFIED`
- [ ] Issue both tokens; insert the `RefreshToken` row with a fresh `familyId`
- [ ] Capture `userAgent` and `ip` on the row
- [ ] `200 { user }` + both cookies

### 2.6 `GET /api/v1/auth/session`

- [ ] `authGuard`; returns `200 { user }` or `401`

### 2.7 `POST /api/v1/auth/logout`

- [ ] **No guard** — logging out with an already-expired access token must
      still clear the cookies, or the user is stranded in a state they cannot
      leave
- [ ] Revoke the presented refresh token's whole **family**
- [ ] Clear both cookies, `204`

### 2.8 `auth.dto.js`

- [ ] `toUser(row)` → `{ id, name, email, emailVerified: row.emailVerifiedAt !== null, createdAt }`
- [ ] **Never** returns `passwordHash`, a token, or `emailVerifiedAt` itself

## Definition of done

- [ ] Register → row exists, `emailVerifiedAt` null, verification job enqueued
- [ ] Verify (token from the **worker log**) → `emailVerified: true`
- [ ] Login → both cookies set, `RefreshToken` row created
- [ ] `GET /session` with the cookie → the user; without → 401
- [ ] Logout → cookies cleared, refresh row revoked, second logout still 204
- [ ] Login before verifying → 403 `EMAIL_NOT_VERIFIED`
- [ ] Login with a wrong password and with an unknown email produce **byte-identical** bodies

## Traps

- `data.code` on **every** error (§2.2). The frontend renders copy from the
  code and ignores `message` entirely — an error without one is unrenderable.
- No mail transport yet: the verification token is only in the worker log.
