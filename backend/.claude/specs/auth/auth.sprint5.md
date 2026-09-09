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
- [ ] Register a strategy **only when its client id/secret pair is present** —
      `config.oauth.<provider>.isConfigured` — so a developer without Google
      keys can still boot (§11)
- [ ] `app.js`: `passport.initialize()` only — never `passport.session()`
- [ ] Each provider needs its own scope, and the verified flag is read
      differently from each — see the table below. Getting this wrong fails
      **open**, which is the whole risk in §5.3
- [ ] **Credentials come from `config`, never `process.env`.** `src/config/env.js`
      is the only file in the repo allowed to read `process.env`, and the
      fail-fast list there is meaningless once another file reads around it.
      The credentials are already wired as `config.oauth.google` and
      `config.oauth.github` (`clientId`, `clientSecret`, `callbackUrl`,
      `isConfigured`)

```js
import { Strategy as GitHubStrategy } from 'passport-github2';
import config from './env.js';

const { clientId, clientSecret, callbackUrl } = config.oauth.github;

passport.use(
  new GitHubStrategy(
    {
      clientID: clientId,
      clientSecret,
      callbackURL: callbackUrl,      // config.oauth.github.callbackUrl
      scope: ['user:email'],         // without it, no verified flag — see Traps
    },
    // `session: false`, so this verify callback hands a user to the route
    // handler and nothing is serialized into a session.
    async (accessToken, refreshToken, profile, done) => {
      // Resolve to a User by the §5.3 linking rules — never by email alone.
      // Any expected failure is an AppError; `done(err)` carries it to the
      // callback route, which redirects with a code (§5.4).
    }
  )
);
```

```js
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import config from './env.js';

const { clientId, clientSecret, callbackUrl } = config.oauth.google;

passport.use(
  new GoogleStrategy(
    {
      clientID: clientId,
      clientSecret,
      callbackURL: callbackUrl,        // config.oauth.google.callbackUrl
      scope: ['profile', 'email'],     // no 'email' scope → no address at all
    },
    async (accessToken, refreshToken, profile, done) => {
      // profile.id                    → the Google `sub`: providerAccountId
      // profile.emails[0].value       → the address
      // profile._json.email_verified  → the ONLY trustworthy verified flag
      //
      // Same as GitHub: resolve through auth.oauth.service.js by the §5.3
      // rules, and `done(err)` on an AppError.
    }
  )
);
```

- [ ] The verify callback holds **no business logic** — it delegates to
      `auth.oauth.service.js` (plan §12.3). A verify callback that grows the
      linking rules puts them somewhere no controller test can reach

#### Reading the verified flag — different in each provider

§5.3 refuses to link an account on an unverified address, so the flag that
decision reads is load-bearing. Neither library surfaces it the obvious way.

| | Google | GitHub |
|---|---|---|
| Stable id | `profile.id` (the OIDC `sub`) | `profile.id` |
| Address | `profile.emails[0].value` | `profile.emails[0].value` |
| Verified | `profile._json.email_verified` | second call to `GET /user/emails` |
| Scope needed | `['profile', 'email']` | `['user:email']` |

- [ ] **Google:** Passport's normalized `profile.emails[]` carries no verified
      field. The flag lives in `profile._json`, the raw claims — and it can
      arrive as the string `"true"` rather than a boolean, so compare
      explicitly rather than testing truthiness. Every non-empty string is
      truthy, including `"false"`
- [ ] **GitHub:** the profile has no verified flag at all. `user:email` grants
      access to `GET /user/emails`, which returns
      `{ email, primary, verified }` per address — pick the **primary** one and
      read its `verified`. This is a second API call, not a field on `profile`
- [ ] Neither provider's flag may be defaulted to `true` when absent. Absent
      means unverified, which means `403 OAUTH_EMAIL_UNVERIFIED` — a missing
      scope must fail closed, and this is exactly the trap that fails open

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
      correct path is `/api/v1/auth/{provider}/start` — no `/oauth` segment,
      see §5.6 (§2.3)
- [ ] Remove `aria-disabled="true"` and the *Coming soon* title

### 5.6 Routes — the callback path is pinned by the provider console

**These four paths are fixed. They are not a naming preference.** The callback
URL is registered in the GitHub OAuth App and in the Google console, and the
provider compares it to what we send character for character. Renaming a route
here without editing both consoles breaks sign-in with `redirect_uri_mismatch`
at the *provider*, before a single line of our code runs — which is why this is
one of the few places a spec pins a literal string.

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/api/v1/auth/github/start` | signs `state`, `302` to GitHub |
| `GET` | `/api/v1/auth/github/callback` | **the registered callback** |
| `GET` | `/api/v1/auth/google/start` | signs `state`, `302` to Google |
| `GET` | `/api/v1/auth/google/callback` | the registered callback |

- [ ] **There is no `/oauth` segment.** Plan §9 rows 12–13 originally wrote
      these as `/oauth/:provider/*`; the GitHub OAuth App is registered at
      `/api/v1/auth/github/callback`, so the plan was corrected to match the
      console rather than the console to the plan — the console is the side
      that cannot be changed by a deploy. Plan §9 now carries both the rows and
      the reason
- [ ] Values live in `GITHUB_CALLBACK_URL` / `GOOGLE_CALLBACK_URL` as **whole
      URLs**, not a base joined to a path in code. A URL assembled at runtime
      is a URL nobody can paste next to the console field to compare, and the
      mismatch never surfaces on our side
- [ ] Register these **before** any `/:param` route under `/api/v1/auth`, or a
      parameterized sibling shadows them

#### The callback handler is not a webhook

Worth stating because it changes how it is built and secured. This endpoint is
an **OAuth redirect callback**: the *user's browser* arrives by `GET`, carrying
`?code=…&state=…`, mid-navigation. A webhook would be GitHub's own servers
`POST`ing an event with a signature header to verify.

The consequences are the ones that get missed:

- [ ] It is **`GET`, and it is CSRF-relevant** — which is precisely what the
      signed `state` in §5.2 defends. There is no signature header to check;
      `state` is the only thing making the request trustworthy
- [ ] It **must end in a `302`, never JSON** (§5.4) — a browser is rendering
      the response
- [ ] The `code` is single-use and short-lived; it is exchanged server-side and
      **never logged**. It is a credential, and the logger's redaction list
      cannot see one sitting inside a URL string
- [ ] Rate limited by `oauthLimiter` (15m / 20), like `/start`

#### Files

- [ ] `auth.routes.js` — the four routes above, `oauthLimiter` on each
- [ ] `auth.oauth.controller.js` — reads `req.user` from Passport, sets both
      cookies, redirects. No linking logic
- [ ] `auth.oauth.service.js` — the §5.3 linking rules (plan §12.3 splits this
      out of `auth.service.js` deliberately)

## Definition of done

- [ ] Google sign-in creates an account, verified, no password hash
- [ ] Signing in again with the same Google account reuses the same user
- [ ] A Google account whose email matches an existing password account **links**
      — one user row, two ways in
- [ ] A GitHub account with an unverified primary email is refused
- [ ] A tampered or missing `state` is rejected
- [ ] Booting with no Google keys still starts the server; `/google/start` 404s
      while `/github/start` keeps working
- [ ] `GET /api/v1/auth/github/callback` and `GET /api/v1/auth/google/callback`
      both resolve — each path matches its console registration exactly, so the
      provider redirects back rather than refusing with `redirect_uri_mismatch`
      (Google calls the field *Authorized redirect URIs*, GitHub *Authorization
      callback URL*; both compare the whole string)
- [ ] A Google account whose `email_verified` is absent or `"false"` is refused
      with `OAUTH_EMAIL_UNVERIFIED` — the flag is read from `profile._json` and
      compared explicitly, not tested for truthiness
- [ ] The callback responds `302`, never JSON, on both success and failure

## Traps

- The callback URL must match the provider console **character for character**,
  including the port and the trailing slash. The registered path is
  `/api/v1/auth/<provider>/callback` — **no `/oauth` segment** (§5.6). Changing
  a route here without editing the console breaks sign-in at the provider, so
  nothing in our logs explains it.
- `http://localhost:5000` is registered for development. A deploy needs its own
  callback registered in the same OAuth App and its own `GITHUB_CALLBACK_URL` /
  `GOOGLE_CALLBACK_URL` — the host is part of the string being compared.
- `passport-github2` returns `profile.emails` without verification status unless
  the `user:email` scope was requested — silently, so this fails open if missed.
- `passport-google-oauth20` drops `email_verified` when it normalizes the
  profile: it survives only on `profile._json`. Reading `profile.emails[0]` and
  finding no `verified` field reads like "this provider does not tell us", when
  in fact it did and the value was discarded one object up.
- Google returns `email_verified` as the string `"true"` in some flows and a
  boolean in others. `if (profile._json.email_verified)` therefore also passes
  for `"false"` — every non-empty string is truthy. Compare explicitly.
- The Google client secret is a **client** secret in name only: it is not
  rotatable per environment from the console without re-issuing, so a leaked
  one means a new OAuth client. Keep it out of `.env.example` and out of logs.
