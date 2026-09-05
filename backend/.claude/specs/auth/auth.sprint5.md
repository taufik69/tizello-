# Sprint 5 — Google and GitHub OAuth (Passport)

**Plan steps:** 9–10 · **Depends on:** sprint 3

## Goal

Someone can sign in with Google or GitHub, and an OAuth identity whose verified
email matches an existing account **links** to it rather than creating a second.

## Tasks

### 5.1 `src/config/passport.js`

- [ ] `passport-google-oauth20` and `passport-github2`
- [ ] **`session: false` on every strategy.** Passport's session support would
      install a second, competing session mechanism beside our tokens
- [ ] Register a strategy **only when its client id/secret pair is present**, so
      a developer without Google keys can still boot (§11)
- [ ] `app.js`: `passport.initialize()` only — never `passport.session()`
- [ ] GitHub needs the **`user:email` scope**, or the verified flag is unavailable

### 5.2 Signed `state` — not optional

- [ ] `/start` signs a short JWT `{ next, nonce }`, 10-minute expiry, as `state`
- [ ] `/callback` verifies it before anything else
- [ ] `next` travels **inside** the signed state, not as a query parameter, so
      it cannot be tampered with — and is still re-checked as a same-origin
      relative path, because a signed open redirect is still an open redirect

> Without `state` the callback accepts any code an attacker can get delivered.
> That is login-CSRF: the victim is silently signed in to the **attacker's**
> account and everything they then do belongs to the attacker.

### 5.3 Account linking (§5.3) — get this right the first time

```
OAuthAccount(provider, providerAccountId) exists?  → sign that user in
   else provider says email verified?
        no  → 403 OAUTH_EMAIL_UNVERIFIED, do NOT link
        yes → User with that email exists?
                 yes → link: insert OAuthAccount → that user
                 no  → create User, emailVerifiedAt = now, passwordHash = null
```

- [ ] Never link on an unverified provider email. If a provider let someone sign
      up as `victim@example.com` without proving it, linking hands over the
      victim's account
- [ ] A new OAuth user is created **already verified** — the provider vouched;
      asking them to prove it again is theatre
- [ ] Look up by `(provider, providerAccountId)`, **never** by email — emails
      change at the provider, the `sub` does not (§3.2)

### 5.4 Callback ends in a redirect

- [ ] Success → set both cookies, `302` to `${CLIENT_ORIGIN}${next ?? '/board/sprint'}`
- [ ] Failure → `302` to `/sign-in?error=<code>`; the frontend maps the code to
      copy exactly as it does for a form error
- [ ] Never render JSON here — the browser is mid-navigation and the user would
      be left staring at a response body

### 5.5 Frontend

- [ ] `social-buttons.tsx` links to `/api/auth/oauth/{provider}/start`; the
      correct path is `/api/v1/auth/oauth/{provider}/start` (§2.3)
- [ ] Remove `aria-disabled="true"` and the *Coming soon* title

## Definition of done

- [ ] Google sign-in creates an account, verified, no password hash
- [ ] Signing in again with the same Google account reuses the same user
- [ ] A Google account whose email matches an existing password account **links**
      — one user row, two ways in
- [ ] A GitHub account with an unverified primary email is refused
- [ ] A tampered or missing `state` is rejected
- [ ] Booting with no Google keys still starts the server; `/oauth/google/start` 404s

## Traps

- The callback URL must match the provider console **character for character**,
  including the port and the trailing slash.
- `passport-github2` returns `profile.emails` without verification status unless
  the `user:email` scope was requested — silently, so this fails open if missed.
