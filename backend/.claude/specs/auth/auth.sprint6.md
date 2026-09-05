# Sprint 6 — Rate limiting on Redis, and the auth contract doc

**Plan steps:** 11–12 · **Depends on:** sprint 2 (5 for the OAuth limiter)

## Goal

The limits the spec asks for actually hold across processes, and `auth` has the
contract doc that makes it a finished module.

> CLAUDE.md: *"A module without a current contract doc is not finished."*

## Tasks

### 6.1 Redis-backed limiters — `src/shared/middlewares/rateLimiter.js`

- [ ] `rate-limit-redis`, sharing the `redisClient` from `config/redis.js`
- [ ] **Fail closed** when Redis is unreachable. An auth limiter that fails open
      is decorative (§9)

With the default in-memory store every process keeps its own counter, so the
real limit is `max × instances` and it resets on every deploy.

| Limiter | Window / max | Endpoints |
|---|---|---|
| `authLimiter` *(exists)* | 15m / 10 | login, verify-code, verify-email, reset-password |
| `registerLimiter` | 1h / 5 | register |
| `recoveryLimiter` | 1h / 5 | forgot-password, request-code |
| `resendLimiter` | 1h / 3 | resend-verification |
| `refreshLimiter` | 15m / 60 | refresh — a background call, not a guess |
| `oauthLimiter` | 15m / 20 | oauth start + callback |

### 6.2 Keyed per IP **and** per email

- [ ] `keyGenerator` combines IP and normalized email
- [ ] It **normalizes the email itself** (lowercase + trim): the limiter runs
      *before* the validator, so it cannot rely on `req.body` being normalized
- [ ] IP alone lets one attacker spread guesses across a botnet; email alone
      lets one IP walk a user list

### 6.3 `docs/api/auth.md`

Follow [api-contract-doc](../../skills/api-contract-doc/SKILL.md) — structure and
depth are specified there, and `auth.md` is named as the reference example other
modules will be measured against.

- [ ] §1 sibling-contract check, with the **deliberate divergences** enumerated:
      1. `data.code` instead of `error.code` (plan §2.2)
      2. `/logout` takes no guard (plan §7)
      3. `/refresh` gets a looser limiter than login
      4. a possible seventh file, `auth.oauth.service.js` (plan §10.1)
- [ ] §2 identity model: email normalization, account states, legal transitions
- [ ] §3 cross-cutting policies — one `##` each, with **Setting / Env var /
      Default** tables: tokens & sessions, OTP, rate limits (with a *Why*
      column), enumeration, caching (*"nothing here is cached, because a stale
      hit means a revoked token still answering"*)
- [ ] The `Condition | Behaviour | Why` failure table from plan §9 — the
      most-consulted part of a contract during an incident
- [ ] Per-endpoint sections, numbered, in the order a client meets them

## Definition of done

- [ ] Two `npm run dev` instances on different ports share one counter
- [ ] Killing Redis makes auth endpoints 429 rather than pass
- [ ] Eleven logins in 15 minutes → 429 with the standard envelope
- [ ] `docs/api/auth.md` states a **why** for every security decision, not just
      request and response shapes

## Traps

- `express-rate-limit` v8 changed the store interface; check the version in
  `package.json` against the `rate-limit-redis` docs before writing the adapter.
- Limiting on `req.ip` behind a proxy limits *the proxy*. Set `app.set('trust
  proxy', …)` deliberately — and never to `true` blindly, which lets a client
  spoof `X-Forwarded-For` and bypass every limit.
