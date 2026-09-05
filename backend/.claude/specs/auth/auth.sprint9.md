# Sprint 9 — Invitation contract doc and frontend cutover

**Plan steps:** 18–19 · **Depends on:** sprint 8

## Goal

The second module is finished by its own definition, and the frontend stops
talking to fixtures.

## Tasks

### 9.1 `docs/api/invitation.md`

Same skill, same depth as `auth.md`
([api-contract-doc](../../skills/api-contract-doc/SKILL.md)).

- [ ] §1 sibling check against `auth.md`, with the divergences enumerated:
      1. `invitation.repository.js` writes `Membership` rows — a table it does
         not otherwise own. Accepting is one atomic operation, and splitting it
         across two repositories would put the transaction boundary in the wrong
         place. *One repository per module, not one table per module* (§6.8)
      2. `GET /invitations/:token` is the only unauthenticated route outside
         `auth`, and why its response is capped at the email's own contents
      3. `DELETE` that does not delete (§7.1)
- [ ] §2 the invitation lifecycle: derived status, legal transitions, the
      email-binding rule and what it defends
- [ ] §3 policies: token entropy and hashing, the 7-day TTL and its tie to
      shipped copy, per-workspace rate limits with a *Why* column, and the
      deliberate collapse of three dead states into `404`
- [ ] The `Condition | Behaviour | Why` failure table

### 9.2 Frontend cutover

- [ ] `src/lib/auth.ts` and `src/lib/auth-tokens.ts`: fixtures → `fetch`.
      `auth.ts`'s own header says this is *"a change to this file and nothing
      else"* — hold it to that
- [ ] `src/lib/demo-invites.ts` → real calls
- [ ] Every request sends **`credentials: 'include'`**, or no cookie is ever sent
- [ ] Error unwrapping reads **`body.data.code`**, not `body.error.code` (§2.2)
- [ ] `social-buttons.tsx`: `/api/v1/auth/oauth/{provider}/start`, and drop
      `aria-disabled` (§2.3)
- [ ] Add `INVITE_EMAIL_MISMATCH` to `AUTH_ERROR_CODES` and `AUTH_ERROR_COPY`
- [ ] A `401 TOKEN_EXPIRED` triggers one `/refresh` and one retry — and **never
      loops**: a second 401 after a refresh must sign the user out
- [ ] Delete the fixture literal `000000` login code. Spec §14 has an acceptance
      check that it never ships

### 9.3 Close the loop

- [ ] Re-read plan §13's open questions and answer them in the contract docs
- [ ] Anything that changed during implementation goes back into
      `.claude/plan/authentication.md` — the plan is the record of *why*, and a
      stale plan is worse than none

## Definition of done

- [ ] The frontend runs with **zero** fixture imports in the auth and invite paths
- [ ] Sign up → verify → sign in → refresh after 15 minutes → sign out, all
      against the real API
- [ ] Invite → accept, end to end, in the browser
- [ ] `docs/api/auth.md` and `docs/api/invitation.md` both exist and both explain
      *why*, not just *what*
- [ ] No `console.*` anywhere in `src/` except the one in `config/env.js`

## Traps

- A refresh-retry loop is the classic way this cutover takes a site down: every
  request 401s, each fires a refresh, each refresh 401s. Cap it at one retry.
