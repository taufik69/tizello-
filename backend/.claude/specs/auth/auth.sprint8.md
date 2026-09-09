# Sprint 8 — Invitations, recipient side (and the deadlock fix)

**Plan steps:** 15–17 · **Depends on:** sprints 2, 7 · **Blocks:** 9

> **This is the sprint that makes the feature usable.** Sprint 7 alone leaves an
> invited stranger able to receive a link and unable to do anything with it.

## Goal

Someone with no Tizello account clicks an invitation link, creates an account
through it, and lands in the workspace as a member — with no verification email
in the way.

## Tasks

### 8.1 `GET /api/v1/invitations/:token` — the one public route

- [ ] **No guard.** Unauthenticated by necessity: the recipient has no account
- [ ] `200 { token, workspaceId, workspaceName, invitedByName, role }` — this
      shape is the **ceiling, not a starting point**. No member list, no member
      count, no inviter email, no workspace settings (§6.7)
- [ ] Expired → `410`
- [ ] **Revoked, declined, already-accepted and never-existed all → `404`** (§6.6)
- [ ] `inviteLookupLimiter` — 15m / 30 per IP

Why they collapse: `InvitationLookup` in the frontend types has exactly three
states, and the shipped copy for `UNKNOWN` already reads *"mistyped, cancelled,
or already used."* Inventing a fourth state breaks the page rather than informing
it — and distinguishing *revoked* from *never existed* tells a token-guesser
that a token was once real.

### 8.2 `POST /api/v1/invitations/:token/accept`

- [ ] `authGuard`
- [ ] **Email binding** (§6.2): the signed-in account's email must equal
      `Invitation.email`, and be verified

| Situation | Response |
|---|---|
| emails match, verified | accept |
| emails differ | `403 INVITE_EMAIL_MISMATCH` |
| emails match, unverified | `403 EMAIL_NOT_VERIFIED` |
| already a member | `200`, no-op |

- [ ] One `prisma.$transaction`: create `Membership`, set `acceptedAt` and
      `acceptedById`
- [ ] Read the invitation row `FOR UPDATE` — without the lock an accept racing a
      revoke can both succeed and a revoked invitation still grants membership
- [ ] **Idempotent** (§6.5): a membership that already exists returns `200` with
      it, never a `409` from the unique constraint. A double-clicked Accept must
      not report failure for something that succeeded
- [ ] If the accepting user is still unverified *and the addresses match*, set
      `emailVerifiedAt = now` — the token was delivered to that address, which
      is exactly what a verification email proves (§6.3)

### 8.3 `POST /api/v1/invitations/:token/decline`

- [ ] `authGuard`, same email binding, sets `declinedAt`, `204`

### 8.4 `inviteToken` on register — the deadlock fix

Without this the invite path **cannot complete** (§6.4):

```
register → emailVerifiedAt null, no session
   → login → 403 EMAIL_NOT_VERIFIED
      → cannot reach the accept screen
         → waiting on a verification email that never arrives
```

Neither half is wrong alone. They are only wrong together, on this path.

- [ ] `POST /auth/register` accepts an optional `inviteToken`
- [ ] Valid, and the registered email matches the invitation's address → one
      transaction: create the user with `emailVerifiedAt = now`, create the
      membership, mark the invitation accepted, **and issue the session**
- [ ] Response then carries both cookies and `data.inviteApplied: true`
- [ ] **A bad, expired or mismatched `inviteToken` must NOT fail the
      registration.** Create the account normally and return
      `data.inviteApplied: false`. Losing an account because an invitation
      expired mid-signup is a worse outcome than an extra click

### 8.5 Frontend gap to raise

- [ ] `INVITE_EMAIL_MISMATCH` is not in the closed `AuthErrorCode` union in
      `frontend/src/types/auth.ts` and has no copy. The trap is ordinary —
      signed in as `bob@personal.com`, invited as `bob@work.com` — and failing
      silently there is a dead end. Suggested copy: *"This invitation was sent to
      a different address. Sign in as {email} to accept."* Naming the address is
      safe: whoever holds the token was already told it by the email

## Definition of done

- [ ] The built accept screen renders VALID / EXPIRED / UNKNOWN against real data
- [ ] Accept creates the membership and closes the invitation
- [ ] **Accept twice → `200` both times**, one membership row
- [ ] Accepting while signed in as a different address → `403 INVITE_EMAIL_MISMATCH`
- [ ] Decline sets `declinedAt`; the link then 404s
- [ ] **The whole path, no account to member:** open the link → sign up →
      land in the workspace, signed in, **never once asked to verify an email**
- [ ] Registering with a garbage `inviteToken` still creates the account
