# Sprint 4 — Login codes and password recovery

**Plan steps:** 7–8 · **Depends on:** sprint 3

## Goal

The **default** sign-in path works — a 6-digit code, not a password — and a
forgotten password can be reset.

> Spec §1: *"The login code is the default path. A code sent to the address just
> typed cannot be forgotten, which deletes the single largest cause of failed
> sign-ins rather than decorating it."* The frontend's two-step form is already
> built around this.

## Tasks

### 4.1 `POST /api/v1/auth/login/request-code`

- [ ] **`202` always**, unknown address included, with constant-time padding
- [ ] Invalidate any outstanding code for the user before issuing a new one —
      spec §9: a code is *"invalidated by a successful sign-in or a newer request"*
- [ ] 6 digits via `crypto.randomInt`, **bcrypt-hashed** (§3.4), 10-minute expiry
- [ ] Enqueue `send-login-code` with the raw code

### 4.2 `POST /api/v1/auth/login/verify-code`

- [ ] Look up the newest unconsumed code for the email
- [ ] `attempts >= LOGIN_CODE_MAX_ATTEMPTS` → burn the code, `401 CODE_INVALID`
- [ ] Wrong code → **increment `attempts` on the row**, `401 CODE_INVALID`
- [ ] Expired → `410 CODE_EXPIRED`
- [ ] Correct → set `consumedAt`, issue both cookies, `200 { user }`
- [ ] The counter lives on the row, **not in Redis** — a cap that resets on
      deploy is not a cap (§3.4)

### 4.3 `POST /api/v1/auth/forgot-password`

- [ ] **`202` always**, constant-time padded
- [ ] `PASSWORD_RESET` token, 1-hour expiry, stored hashed
- [ ] Enqueue `send-reset` with the raw token

### 4.4 `POST /api/v1/auth/reset-password`

- [ ] Look up by `tokenHash` **and `purpose: PASSWORD_RESET`**
- [ ] `400 TOKEN_INVALID` / `410 TOKEN_EXPIRED` / `422 WEAK_PASSWORD`
- [ ] Set the new hash, consume the token, and **revoke every refresh-token
      family for the user** — spec §9: *"Invalidate all sessions on password
      reset."* A reset that leaves the attacker's session alive has done nothing
- [ ] Returns `200` and **no session**. Possession of a link is not proof of
      identity (spec §6.4); the user signs in afresh

### 4.5 Worker

- [ ] `send-login-code` and `send-reset` handlers in `email.worker.js`
- [ ] Both log at `info` with the recipient but **never the code or token** —
      the root logger redacts `token`, and that is a safety net, not permission

## Definition of done

- [ ] request-code → code in the worker log; verify → signed in
- [ ] Five wrong attempts burn the code; the sixth fails even with the right code
- [ ] A second request-code invalidates the first code
- [ ] An 11-minute-old code → `410 CODE_EXPIRED`
- [ ] Reset password → **every** existing session dies; the old refresh cookie 401s
- [ ] request-code and forgot-password return in the same time for a real and an
      unknown address (measure it — this is the whole point of the padding)

## Traps

- Incrementing `attempts` only on a *found* code lets an attacker reset the
  counter by guessing against a different email. Key the limiter on both.
- The frontend fixture accepts the literal `000000`. Spec §14 has an acceptance
  check that it never ships — make sure nothing similar exists here.
