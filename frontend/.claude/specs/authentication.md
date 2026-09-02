# Spec — Authentication module

**Status:** draft, awaiting review
**Scope:** frontend only. No `backend/` changes — see `.claude/rules/scope.md`.
**Depends on:** `DESIGN-SYSTEM.md`, `.claude/rules/ui-components.md`,
`.claude/rules/pages-and-structure.md`

---

## 1. Goal

Let a person create a Tizello account, prove they own the email, sign in, and
recover a lost password — on a two-panel screen where the left half is the form
and the right half is an animated illustration.

### In scope (v1)

| # | Capability |
| --- | --- |
| 1 | Sign up with email + password |
| 2 | Email verification (account starts unverified) |
| 3 | Sign in, **two-step** — email, then password |
| 4 | Forgot password → emailed link → set a new one |
| 5 | Social sign-in buttons (Google, GitHub) |
| 6 | Sign out |
| 7 | Route protection: `/board/*` requires a session |

### Out of scope (write down, build later)

2FA / TOTP · passkeys · magic links · "remember this device" · account
deletion · profile editing · team invitations · SSO/SAML · session management
UI ("sign out other devices") · rate-limit CAPTCHA.

### Frontend-only constraint

There is no auth server yet. Everything that would call one goes behind
**`src/lib/auth.ts`**, backed by in-memory fixtures — the same pattern as
`src/lib/boards.ts`. §9 records the exact HTTP contract the backend must later
satisfy; **do not implement it.** Swapping fixtures for `fetch` should be a
change to that one file.

---

## 2. What Trello does, and where we diverge

Observed on `id.atlassian.com` (Sept 2026 — Trello delegates auth to Atlassian ID):

| Trello | Tizello | Why |
| --- | --- | --- |
| Centered card, illustrations flanking it | **Split panel** — form left, animation right | The brief. Also gives the illustration room to actually animate. |
| Two-step: email → Continue → password | **Two-step, kept** | Requested. §6.2 changes *how* step 1 works. |
| Step 1 hits the server to look up the account | **Step 1 is client-side only** | Trello's version is a user-enumeration oracle. Same UX, no oracle. See §6.2. |
| Google, Microsoft, Apple, Slack | **Google, GitHub** | Dev-tool audience. |
| Signup asks email only, then a second screen | **One signup form**: name, email, password | Two-step signup buys nothing once we're not doing an account lookup. |
| Passkey button | Not in v1 | Listed above. |

Metrics worth copying from their form (they are well-tuned):

- Input height **36px**, label **12px / 600** above the field
- Primary button height **40px**, full width
- Social buttons **40px**, full width, 1px border, stacked
- Form column **320px** content width

Ours use our own tokens: `rounded-sm` (4px) not their 6px, `text-sm` body.

---

## 3. Routes

A route group so the shell is defined once and the URLs stay clean.

```
src/app/
  (auth)/
    layout.tsx              # the split shell — renders on every auth screen
    sign-in/page.tsx        # /sign-in
    sign-up/page.tsx        # /sign-up
    forgot-password/page.tsx# /forgot-password
    reset-password/page.tsx # /reset-password?token=…
    verify-email/page.tsx   # /verify-email?token=…
```

| Route | Purpose | Auth state |
| --- | --- | --- |
| `/sign-in` | Two-step sign in | redirect to `/board/sprint` if already signed in |
| `/sign-up` | Create account | same |
| `/forgot-password` | Request a reset link | public |
| `/reset-password` | Set a new password from `?token=` | public, token-gated |
| `/verify-email` | Consume `?token=`, confirm the address | public, token-gated |

`?next=` is honoured on `/sign-in` and `/sign-up` so a protected-route bounce
returns the user where they were going. **Only same-origin relative paths are
accepted** — an absolute URL is an open-redirect and must be dropped.

---

## 4. The split shell

`(auth)/layout.tsx`, a Server Component. Nothing in it is interactive.

```
┌───────────────────────────┬───────────────────────────┐
│                           │                           │
│   ◆ Tizello               │                           │
│                           │      [ animated SVG ]     │
│   Log in to continue      │                           │
│   ┌─────────────────────┐ │      Organise anything    │
│   │ Email               │ │      Boards, lists and    │
│   │ [_________________] │ │      cards for the work   │
│   └─────────────────────┘ │      your team actually   │
│   [     Continue      ]   │      does.                │
│   ─────── or ───────      │                           │
│   [ G  Google          ]  │                           │
│   [ ⌥  GitHub          ]  │                           │
│                           │                           │
│   Create an account       │                           │
│                           │                           │
│   Privacy · Terms         │                           │
└───────────────────────────┴───────────────────────────┘
     bg-surface, 50%              bg-board, 50%
```

| Property | Value |
| --- | --- |
| Grid | `lg:grid-cols-2`, each panel `min-h-dvh` |
| Left panel | `bg-surface`, form column `max-w-[22rem]` (352px), vertically centred |
| Right panel | `bg-board` with a brand gradient overlay, `hidden lg:grid` |
| Below `lg` | Right panel is **removed entirely**, not stacked. Left panel goes full width. Nobody scrolls past decoration to reach a login form. |
| Logo | Top-left of the left panel, links to `/` |
| Footer | Privacy · Terms links, `text-2xs text-text-subtle`, bottom of left panel |

The right panel's copy changes per route (sign-in vs sign-up get different
lines); the layout takes it from a small map keyed by pathname, or each page
passes it via a slot. **Decision: a `<AuthAside>` component with a `variant`
prop**, rendered by the layout from `usePathname`… no — that would make the
layout a client component. **Use a parallel route or per-page prop instead:**
each `page.tsx` renders its own `<AuthAside variant="sign-in" />`, and the
layout only provides the grid. Keeps everything server-side.

---

## 5. The animated illustration

A single inline SVG component, `components/auth/auth-illustration.tsx`.

**It is a Server Component.** The animation is declarative CSS inside the SVG —
no `useEffect`, no animation library, no `"use client"`. This is the point: a
decorative animation should cost zero JavaScript.

### What it shows

A miniature Tizello board assembling itself, on loop:

| Beat | Time | What happens |
| --- | --- | --- |
| 1 | 0.0s | Three empty columns fade + rise into place, staggered 120ms |
| 2 | 0.8s | Five cards slide in from the left, staggered 140ms |
| 3 | 2.2s | One card's label bar wipes from 0 → full width |
| 4 | 2.6s | A checkbox on another card ticks (path draws left → right) |
| 5 | 3.0s | One card lifts and settles into the next column |
| 6 | 4.2s | Everything holds |
| — | 6.0s | Loop restarts with a cross-fade, not a hard cut |

Continuous under all of it: the whole board drifts ±4px vertically over 8s, out
of phase with the 6s loop so the motion never looks metronomic.

### Rules

- **`prefers-reduced-motion: reduce` → no motion.** Not "slower". The SVG
  renders its final frame — assembled board, filled label, ticked box — as a
  static image. Implement by wrapping every `animation` declaration in
  `@media (prefers-motion: no-preference)`, so static is the default and motion
  is the enhancement.
- Animate **`transform` and `opacity` only**, plus `stroke-dashoffset` for the
  tick. No animating `width`, `x`, `y`, or filters — they force layout on every
  frame.
- Colours come from the palette via `currentColor` and hard-coded brand hexes
  only where an SVG cannot read a CSS variable. Prefer `fill="currentColor"`
  with opacity so the panel's ink token drives it.
- `aria-hidden="true"` and no `<title>`. It is decoration; the adjacent heading
  carries the meaning.
- Budget: **under 12KB** of inline markup. If it grows past that, simplify the
  drawing — do not move it to a file and add a request.

---

## 6. Screens

Shared field anatomy for every input:

```
Label                       text-xs font-semibold text-text-muted, 4px below
[ input                  ]  h-9 rounded-sm border-border bg-surface text-sm
Helper or error             text-2xs, text-text-subtle / text-danger
```

- Error state: `border-danger`, message in `text-danger`, `aria-invalid="true"`,
  `aria-describedby` pointing at the message, `role="alert"` on the message.
- The focus ring is the global one from the base layer. Do not add per-field
  focus styles.
- Every input carries the correct `autocomplete` (§6.6) or password managers
  will fight the form.

### 6.1 `/sign-up`

Heading: **Sign up for Tizello** · Sub: *Free forever for your first 10 boards.*

| Field | Type | `autocomplete` | Validation |
| --- | --- | --- | --- |
| Full name | text | `name` | required, 2–80 chars |
| Email | email | `email` | required, valid shape, ≤254 chars |
| Password | password | `new-password` | required, 8–128, see §7 |

Below the fields:

- **Password strength meter** — four segments, fills as the password improves.
  Advisory only; it never blocks submission. Client-side, no dependency.
- **Show/hide password** toggle, `aria-pressed`, label changes "Show"/"Hide".
- Terms line, static text: *By signing up you agree to the Terms of Service and
  Privacy Policy.* — **not a checkbox.** A checkbox implies a consent record
  that the backend does not yet store; don't fake it.
- Primary button: **Sign up**
- Divider `— or —`, then Google / GitHub
- Footer link: *Already have an account? Log in*

On success → redirect to `/verify-email?pending=1` (the "check your inbox"
state, §6.5), **not** to the board. The account exists but is unverified.

### 6.2 `/sign-in` — two-step

**Step 1 — email**

| Field | `autocomplete` |
| --- | --- |
| Email | `username` |

- Button: **Continue**
- Below: Google / GitHub, then *Can't log in?* → `/forgot-password` ·
  *Create an account* → `/sign-up`

> **Step 1 never calls the server.** It validates the email's shape on the
> client and advances. Trello's equivalent performs an account lookup, which
> tells an attacker whether an address is registered — an enumeration oracle on
> an unauthenticated endpoint. We keep the two-step *feel* and drop the oracle.
> The single credential check happens on step 2 submit.
>
> Consequence: we cannot route an SSO-only account before the password screen.
> Acceptable — there is no SSO in v1. If it lands later, route on the email's
> **domain** (a config list), never on a per-account lookup.

**Step 2 — password**

- The email is shown as static text with a **Change** button that returns to
  step 1 and refocuses the email field.
- A hidden `email` input keeps the value in the form payload **and** lets
  password managers associate the credential pair.

| Field | `autocomplete` |
| --- | --- |
| Password | `current-password` |

- **Remember me** checkbox — 30-day session vs session-cookie. Default off.
- Button: **Log in**
- Link: *Forgot password?*

Both steps live in **one client component** (`sign-in-form.tsx`) holding
`step: "email" | "password"`. It is a leaf; `page.tsx` stays a Server Component.

Focus management: advancing to step 2 moves focus to the password field;
**Change** returns focus to the email field. Announce the step change via a
polite live region — a sighted user sees the form swap, a screen-reader user
must be told.

### 6.3 `/forgot-password`

Heading: **Reset your password** · Sub: *We'll email you a link to set a new one.*

One field: Email (`autocomplete="username"`). Button: **Send reset link**.

> **Always render the same success state**, whether or not the address exists:
> *If an account exists for that address, a reset link is on its way.* Anything
> conditional is an enumeration oracle. The server must return the same response
> and take roughly the same time either way (§9).

Success view replaces the form: confirmation text, the address it went to, and
a **Resend** button disabled for 60s with a visible countdown.

### 6.4 `/reset-password?token=…`

| Field | `autocomplete` | Validation |
| --- | --- | --- |
| New password | `new-password` | 8–128, §7 |
| Confirm password | `new-password` | must match |

Same strength meter and show/hide as sign-up. Button: **Set new password**.

Token is read server-side from `searchParams` and validated **before render**:

- Missing / malformed → render the invalid-token state, no form.
- Expired or already used → invalid-token state with a *Request a new link*
  button to `/forgot-password`.

On success → `/sign-in?reset=1`, which shows a one-time success banner. Do not
auto-sign-in from a reset link; possession of the link is not proof of identity
strong enough for a session.

### 6.5 `/verify-email`

Three states in one route:

| Trigger | State | Shows |
| --- | --- | --- |
| `?pending=1` | **Check your inbox** | Address, *Resend* (60s cooldown), *Wrong address? Sign up again* |
| `?token=…` valid | **Verified** | Success, then auto-redirect to `/board/sprint` after 2s, plus an explicit *Continue* link for anyone who does not want to wait |
| `?token=…` invalid/expired | **Link expired** | *Send a new link* button |

Token consumption happens in a Server Action on load, not in an effect.

### 6.6 Social buttons

Google and GitHub, identical treatment on `/sign-in` and `/sign-up`:

- 40px tall, full width, `border-border bg-surface`, brand mark left, label
  centred, stacked with 8px gaps.
- They are `<a>` elements to `/api/auth/oauth/{provider}/start?next=…`, not
  buttons — an OAuth start is a navigation.
- **In v1 that endpoint does not exist.** They render, are keyboard-reachable,
  and are marked `aria-disabled="true"` with a tooltip *Coming soon* until the
  backend lands. Do not stub a fake OAuth flow.

---

## 7. Validation

Two layers. The client layer is a convenience; **the server layer is the
control.** Every rule below is re-checked in the Server Action regardless of
what the browser did.

| Field | Rule | Message |
| --- | --- | --- |
| Name | 2–80 chars after trim | "Enter your name." |
| Email | RFC-ish shape, ≤254 chars, lowercased before send | "Enter a valid email address." |
| Password | 8–128 chars | "Use at least 8 characters." |
| Password | not on a common-password list *(server only)* | "That password is too common. Try another." |
| Confirm | exact match | "Passwords don't match." |
| Token | present, well-formed | renders the invalid-token state |

Timing:

- **Do not validate on keystroke.** Validate on blur once a field has been
  touched, and on submit for everything.
- Once a field shows an error, re-validate on change so the error clears as soon
  as it is fixed.
- Server errors survive a re-render and are announced via `role="alert"`.

---

## 8. Error taxonomy

The UI never shows a raw server message. Each code maps to copy:

| Code | HTTP | Where shown | Copy |
| --- | --- | --- | --- |
| `INVALID_CREDENTIALS` | 401 | form-level | "That email or password isn't right." |
| `EMAIL_TAKEN` | 409 | on the email field | "An account already uses this email. Log in instead." |
| `EMAIL_NOT_VERIFIED` | 403 | form-level, with action | "Verify your email to continue." + *Resend link* |
| `WEAK_PASSWORD` | 422 | on the password field | "That password is too common. Try another." |
| `TOKEN_INVALID` / `TOKEN_EXPIRED` | 400 / 410 | full-screen state | "This link has expired." |
| `RATE_LIMITED` | 429 | form-level | "Too many attempts. Try again in a few minutes." |
| `SERVER_ERROR` | 5xx | form-level | "Something went wrong. Try again." |

`INVALID_CREDENTIALS` is deliberately ambiguous between "no such account" and
"wrong password" — the pair is the enumeration defence and must not be split.

Note `EMAIL_TAKEN` **is** an enumeration vector on sign-up. It is accepted:
sign-up cannot usefully hide it, and the alternative (silently emailing the
existing owner) is worse UX for a product at this stage. The mitigation is rate
limiting, recorded in §9.

---

## 9. API contract — for the backend, later

The frontend calls these through `src/lib/auth.ts`. **Nobody implements them in
this repo.** Base path `/api/v1/auth`. JSON in, JSON out.

| Method | Path | Body | Success | Errors |
| --- | --- | --- | --- | --- |
| POST | `/register` | `{ name, email, password }` | `201 { user }` | 409 `EMAIL_TAKEN`, 422 `WEAK_PASSWORD` |
| POST | `/login` | `{ email, password, remember }` | `200 { user }` + `Set-Cookie` | 401, 403 `EMAIL_NOT_VERIFIED`, 429 |
| POST | `/logout` | — | `204` + cookie cleared | — |
| GET | `/session` | — | `200 { user }` / `401` | — |
| POST | `/verify-email` | `{ token }` | `200 { user }` | 400, 410 |
| POST | `/resend-verification` | `{ email }` | `202` *(always)* | 429 |
| POST | `/forgot-password` | `{ email }` | `202` *(always)* | 429 |
| POST | `/reset-password` | `{ token, password }` | `200` | 400, 410, 422 |
| GET | `/oauth/{provider}/start` | — | `302` to provider | — |
| GET | `/oauth/{provider}/callback` | — | `302` + cookie | — |

Error body: `{ "error": { "code": "INVALID_CREDENTIALS", "message": "…" } }`

`user`: `{ id, name, email, emailVerified: boolean, createdAt }` — **never a
password hash, never a raw token.**

Requirements on the backend, to be honoured when it is written:

- Password hashing: **argon2id**, or bcrypt cost ≥ 12.
- Session: **httpOnly, Secure, SameSite=Lax** cookie. `Path=/`. 30 days with
  "remember me", session cookie without. The token is never readable by JS and
  never placed in `localStorage`.
- Reset and verification tokens: single-use, ≥128 bits of entropy, stored
  hashed. Reset expires in **1 hour**, verification in **24 hours**.
- `/forgot-password` and `/resend-verification` return `202` for unknown
  addresses and should pad response time to a constant.
- Rate limits, per IP **and** per email: login 10/15min, register 5/hour,
  forgot-password 5/hour, resend 3/hour.
- Invalidate all sessions on password reset.

---

## 10. Session handling in the frontend

- **Reads.** `getSession()` in `src/lib/auth.ts` reads the cookie server-side
  and returns `User | null`. Server Components call it directly. There is no
  client-side session context and no `useSession` hook — a Server Component
  that needs the user awaits it.
- **Writes.** Sign in / sign up / sign out are Server Actions in
  `src/lib/actions/auth-actions.ts`. They set or clear the cookie via
  `next/headers` `cookies()`, then `redirect()`.
- **Protection.** `src/proxy.ts` (Next 16's middleware file) guards
  `/board/:path*`. No session → `307` to `/sign-in?next=<pathname>`. It checks
  only for the cookie's *presence* — cheap. Real validation happens in the page.
- **Reverse guard.** `/sign-in` and `/sign-up` redirect to `/board/sprint` when
  a session already exists.
- **Sign out** is a `<form>` posting to a Server Action — never a `<a href>`.
  A GET that mutates is CSRF-able and gets fired by link prefetchers.

While the backend is absent, `src/lib/auth.ts` fixtures behave as:

- one seeded verified user, `alex@tizello.dev` / `password123`
- one seeded unverified user, to exercise the `EMAIL_NOT_VERIFIED` path
- register appends to the in-memory list and returns unverified
- any 32-char hex token is "valid"; the literal `expired` is expired
- every call sleeps 200–400ms so loading states are real

---

## 11. Components

Per `.claude/rules/ui-components.md`: server by default, `"use client"` only at
leaves, 150 lines hard cap.

| File | Kind | Notes |
| --- | --- | --- |
| `app/(auth)/layout.tsx` | server | the two-panel grid |
| `app/(auth)/*/page.tsx` | server | metadata, session redirect, composition |
| `components/auth/auth-aside.tsx` | server | right panel: illustration + copy, `variant` prop |
| `components/auth/auth-illustration.tsx` | server | the animated SVG (§5) |
| `components/auth/auth-header.tsx` | server | logo, heading, subheading |
| `components/auth/social-buttons.tsx` | server | Google + GitHub links |
| `components/auth/auth-divider.tsx` | server | the "— or —" rule |
| `components/auth/sign-in-form.tsx` | **client** | two-step state machine |
| `components/auth/sign-up-form.tsx` | **client** | fields + strength meter |
| `components/auth/forgot-password-form.tsx` | **client** | + resend cooldown |
| `components/auth/reset-password-form.tsx` | **client** | + confirm match |
| `components/ui/text-field.tsx` | **client** | label + input + error, blur validation |
| `components/ui/password-field.tsx` | **client** | text-field + show/hide toggle |
| `components/ui/password-strength.tsx` | server | pure render from a score prop |
| `components/ui/checkbox.tsx` | server | styled input, no JS |
| `lib/auth.ts` | — | session read + fixture-backed calls |
| `lib/actions/auth-actions.ts` | — | `"use server"` actions |
| `lib/validation/auth.ts` | — | shared client/server field rules |
| `types/auth.ts` | — | `User`, `AuthError`, `AuthErrorCode` |
| `proxy.ts` | — | route protection |

`sign-in-form.tsx` is the file most likely to hit 150 lines. If it does, extract
the two steps into `sign-in-email-step.tsx` / `sign-in-password-step.tsx` and
leave the state machine in the parent.

---

## 12. Design tokens

Everything reuses the existing set. Two additions, following the three-step
procedure in `DESIGN-SYSTEM.md § Adding a semantic token`:

| Token | Light | Dark | Use |
| --- | --- | --- | --- |
| `--auth-panel-from` | `brand-600` | `brand-800` | right-panel gradient start |
| `--auth-panel-to` | `brand-800` | `brand-950` | right-panel gradient end |

Ink on the panel is the existing `--on-board` (5.0:1 / 6.1:1). No other new
tokens; if a screen seems to need one, that is a signal the design drifted.

Both themes must be checked — the right panel is brand-tinted in both, so
`text-inverse` is wrong there for the same reason it was wrong on the board.

---

## 13. Accessibility

- Each screen has exactly one `<h1>`. The illustration contributes no heading.
- The form is a real `<form>` with a real submit button. It works with Enter.
- Errors: `aria-invalid` on the field, `aria-describedby` to the message,
  `role="alert"` on the message so it is announced.
- The two-step transition announces itself via a polite live region, and moves
  focus deliberately (§6.2).
- Show/hide password is a `<button type="button">` with `aria-pressed`, never a
  toggle that submits.
- The strength meter is not colour-only: it carries a text label
  (Weak / Fair / Good / Strong) and `aria-live="polite"`.
- Contrast: everything AA. The panel gradient's lightest point must still clear
  4.5:1 against `--on-board` — check the *lightest* end, not the average.
- Full keyboard pass on every screen, and a visible focus ring throughout.
- The whole module must be usable with `prefers-reduced-motion: reduce`.

---

## 14. Acceptance criteria

- [ ] `npm run build` and `npm run lint` pass; no file over 150 lines
- [ ] Only the four form files and the two field primitives are `"use client"`
- [ ] Every auth `page.tsx` is a Server Component with `metadata`
- [ ] Illustration ships **zero** JavaScript and is static under reduced motion
- [ ] Right panel is absent below `lg`, and no horizontal scroll at 360px
- [ ] Every screen legible and correct in light **and** dark
- [ ] Wrong password on a real account and a login to a non-existent account
      produce the **identical** message and a comparable response time
- [ ] `/forgot-password` shows the same confirmation for known and unknown emails
- [ ] Password managers fill and save on both sign-in steps (`autocomplete` set)
- [ ] `/board/sprint` while signed out redirects to `/sign-in?next=/board/sprint`,
      and signing in returns there
- [ ] `?next=https://evil.example` is ignored, not followed
- [ ] Sign out is a POST
- [ ] Full keyboard traversal of all five screens

---

## 15. Open questions

1. **Name at sign-up** — keep it, or collect it during onboarding? Trello asks
   later. Keeping it costs one field; dropping it means a nameless avatar until
   onboarding exists. *Recommendation: keep it.*
2. **Verification hard gate?** Can an unverified user reach the board in a
   read-only state, or is verification a wall? This spec assumes **a wall**
   (`EMAIL_NOT_VERIFIED` on login). Softening it later is easy; hardening it is
   not.
3. **Remember me default** — spec says off. Some teams prefer on for a tool
   people live in all day.
4. **Illustration art direction** — the assembling board (§5) is one option.
   The alternative is something abstract and slower. Worth a look before it is
   drawn, since it is the most bespoke asset in the module.
5. **`/verify-email` auto-redirect** — 2s is a guess. Some find it abrupt.

---

## 16. Build order

Each step is independently reviewable and leaves the app in a working state.

1. Types, validation rules, `lib/auth.ts` fixtures, `lib/actions/auth-actions.ts`
2. `(auth)/layout.tsx` + `auth-aside` + `auth-header` + a **static** illustration
3. `text-field`, `password-field`, `checkbox`, `password-strength`
4. `/sign-up` end to end
5. `/sign-in` two-step end to end
6. `/forgot-password` + `/reset-password`
7. `/verify-email` three states
8. `proxy.ts` route protection + sign out
9. Animate the illustration, including the reduced-motion path
10. Full a11y and both-themes pass against §14
