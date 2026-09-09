# Sprint 7 — Invitations, admin side

**Plan steps:** 13–14 · **Depends on:** sprints 1, 2 · **Blocks:** 8

## Goal

An OWNER or ADMIN can invite someone to a workspace by email, see who is
outstanding, cancel, and resend. Nothing is acceptable yet — that is sprint 8.

## Tasks

### 7.1 Module skeleton — `src/modules/invitation/`

- [ ] Six files. A **separate module**, not part of `auth`: `auth` is about
      proving who you are, this is about what you may join (§6.8)
- [ ] Mount in `src/routes/index.js`, alphabetical

### 7.2 `POST /api/v1/workspaces/:workspaceId/invitations`

- [ ] `authGuard` + `requirePermission(PERMISSIONS.MEMBER_INVITE)` — the
      workspace **must** be in the path, because `permission.js` resolves the
      caller's membership from `(userId, workspaceId)` (§6.9)
- [ ] Validator: email normalized; **`role` restricted to `ADMIN | MEMBER`**
- [ ] Re-check the role in the service too. An invitation that mints an OWNER is
      a privilege-escalation endpoint and one layer of defence is not enough.
      `frontend/src/types/workspace.ts`: *"Ownership is transferred, never
      granted by invitation."*
- [ ] Already a member → `409 ALREADY_MEMBER` (§6.5) — a token that can only
      ever be a no-op should not be minted
- [ ] A live invitation already exists → `409 INVITE_PENDING`
- [ ] Mint token, store `tokenHash`, `expiresAt = now + INVITE_TTL_DAYS`
- [ ] Enqueue `send-invitation` with the **raw token** — see 7.5
- [ ] `201 { invitation }`

### 7.3 List, revoke, resend

- [ ] `GET .../invitations` — `requirePermission(MEMBER_VIEW)`, **pending only**.
      The members screen shows outstanding invites beside the roster, not a
      history log; filter on the derived status (§3.6)
- [ ] `DELETE .../invitations/:id` — sets `revokedAt`, `204`. The verb describes
      what the admin does to the invitation, not what happens to the row: §3.6
      keeps the row because the audit trail is the point
- [ ] `POST .../invitations/:id/resend` — **rotates the token hash**, pushes
      `expiresAt` out again, re-enqueues. Re-using the old token would mean a
      link the admin believes they replaced still works

### 7.4 `invitation.dto.js` — status is derived

| Check, in order | Status |
|---|---|
| `revokedAt` set | `REVOKED` |
| `declinedAt` set | `DECLINED` |
| `acceptedAt` set | `ACCEPTED` |
| `expiresAt < now` | `EXPIRED` |
| otherwise | `PENDING` |

- [ ] No stored `status` column — a second source of truth drifts the moment one
      write path forgets it (§3.6)

### 7.5 Worker — a breaking change

`email.worker.js` currently reads the invitation back from the database to build
the email. **After sprint 1 it cannot recover the raw token — only the hash is
stored.**

- [ ] The raw token is passed **into the job payload** at mint time
- [ ] The worker still re-reads the row for the workspace and inviter names, and
      keeps its existing revoked/accepted guards
- [ ] The link is `${CLIENT_ORIGIN}/invite/<rawToken>`

### 7.6 Limiters

- [ ] `inviteSendLimiter` — 1h / 50 **per workspace**: an admin mass-inviting
      sends mail from *our* domain to strangers. This is the spam-reputation
      guard, keyed on the workspace because that is the unit doing the sending

## Definition of done

- [ ] An ADMIN can invite; a MEMBER gets `403`
- [ ] `role: "OWNER"` is rejected at the validator **and** the service
- [ ] Inviting an existing member → `409 ALREADY_MEMBER`
- [ ] Inviting twice → `409 INVITE_PENDING`
- [ ] Revoke then re-invite the same address **succeeds** — this is the partial
      index from sprint 1 doing its job
- [ ] Resend produces a working new link and the old one stops working
- [ ] The invite URL appears in the worker log (no mail transport yet)
