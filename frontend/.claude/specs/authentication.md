# Spec — Authentication module

**Status:** revision 2 — Notion-style flow, split-panel layout kept.
Supersedes revision 1's password-first sign-in. Rationale in
`.claude/specs/auth-ux-analysis.md`.
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
| 3 | Sign in, **two-step** — email, then a **6-digit login code**, with password as the fallback |
| 4 | Recovery ("Can't log in?") → emailed link → set a new password |
| 5 | Social sign-in buttons (Google, GitHub) — **grid, not a stack** |
| 6 | Sign out |
| 7 | Route protection: `/board/*` requires a session |

**The login code is the default path.** A code sent to the address just typed
cannot be forgotten, which deletes the single largest cause of failed sign-ins
rather than decorating it. The password stays as a fallback for anyone who set
one, reachable from a link on the same screen.

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

We looked at both. Notion's flow won; the full comparison is in
`.claude/specs/auth-ux-analysis.md`. What we take from where:

| Source | Decision | Why |
| --- | --- | --- |
| **Notion** | Login **code** first, password demoted to a link | Removes the forgotten-password failure branch entirely |
| **Notion** | Social providers in a **grid** | Five stacked bars is a wall on a phone; a grid is two short rows |
| **Notion** | Stay on our own domain, our own branding | Trello hands you to `id.atlassian.com` mid-credential — a trust dip, and the exact shape of a phishing page |
| **Notion** | Helper text does product work, not legal work | "Use your work email" earns its line; terms boilerplate does not |
| **Trello** | A visible **"Can't log in?"** link | Notion hides recovery; that is only safe because it has no passwords at all |
| **Trello** | Explicit **Remember me**, on step 1 | Session length should be a visible control, not a silent default |
| **Trello** | Recovery framed as *recovery*, not "reset password" | Broader, and honest about what people actually lose |
| *Neither* | **Split panel** — form left, animation right | The brief. Both products centre a card; we do not. §4, §5. |
| *Neither* | Step 1 makes **no server call** | Trello's account lookup is a user-enumeration oracle. Same UX without it. §6.2 |
| *Neither* | Google + GitHub only | Dev-tool audience. Trello offers six methods; two is enough. |

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
│                           │   ▱      [ shapes ]       │
│   Log in to continue      │                           │
│   ┌─────────────────────┐ │      Organise anything    │
│   │ Email               │ │      Boards, lists and    │
│   │ [_________________] │ │      cards for the work   │
│   └─────────────────────┘ │      your team actually   │
│   □ Remember me           │      does.                │
│   [     Continue      ]   │                           │
│   ──── or continue ────   │        ◯   ▰              │
│   [ Google ] [ GitHub ]   │                           │
│                           │                           │
│   Can't log in? ·         │                           │
│   Create an account       │                           │
│   Privacy · Terms         │                           │
└───────────────────────────┴───────────────────────────┘
     bg-surface, 50%          gradient + shapes, 50%
```

| Property | Value |
| --- | --- |
| Grid | `lg:grid-cols-2`, each panel `min-h-dvh` |
| Left panel | `bg-surface`, form column `max-w-[22rem]` (352px), vertically centred |
| Right panel | the three animated layers of §5, `hidden lg:grid`, `overflow-hidden` so shapes can bleed past the edge |
| Below `lg` | Right panel is **removed entirely**, not stacked. Left panel goes full width. Nobody scrolls past decoration to reach a login form. |
| Logo | Top-left of the left panel, links to `/` |
| Footer | Privacy · Terms links, `text-2xs text-text-subtle`, bottom of left panel |

The right panel's copy changes per route — sign-in and sign-up get different
lines. Reading the route with `usePathname` would drag the layout across the
client boundary, so instead **the layout provides only the grid**, and each
`page.tsx` renders its own `<AuthAside variant="sign-in" />`. Everything stays
a Server Component. See §5 for what the panel contains.

---

## 5. The right panel — shapes, effects, motion

This is the half of the screen that has to carry the product's confidence. It is
**required**, not decorative garnish: modern geometric composition, real depth,
and continuous motion.

`components/auth/auth-aside.tsx` renders three stacked layers inside the panel.

```
┌───────────────────────────────────────┐
│  layer 3 · copy          "Organise    │
│                           anything"   │
│                                       │
│  layer 2 · shapes    ◜◝  ▱  ◯  ▰      │  ← inline SVG, animated
│                                       │
│  layer 1 · field    ░▒▓ gradient mesh │  ← CSS, animated
└───────────────────────────────────────┘
        bg: --auth-panel-from → --auth-panel-to
```

### Layer 1 — the gradient field

Not a flat fill. Two large, soft radial gradients in brand tones, offset from
each other, drifting on long out-of-phase loops (23s and 31s) so the background
never visibly repeats. Pure CSS on the panel element:

- `background-image`: two `radial-gradient(...)` layers over the linear base.
- Animate `background-position` only — cheap, compositor-friendly.
- A `0.04` opacity noise overlay (inline SVG `feTurbulence`, one filter, sized
  120×120 and tiled) to kill gradient banding. Banding is the single most
  common way a panel like this looks cheap.

### Layer 2 — the shapes

A single inline SVG, `components/auth/auth-shapes.tsx`. Modern geometric
vocabulary, not an illustration of anything:

| Element | Treatment |
| --- | --- |
| 3–5 large rounded rectangles | glassy: low-opacity white fill, 1px lighter stroke, `backdrop-filter: blur()` where supported |
| 1–2 rings (stroked circles) | thin, high-contrast, partially cropped by the panel edge |
| 1 soft blob | organic counterweight to the rectangles, heavily blurred |
| a fine grid or dot field | very low opacity, gives the glass something to sit against |

Composition rules: **asymmetric**, weighted to one side; at least one shape
**bleeds off the panel edge** so it reads as a window onto something larger;
overlap at least twice so depth is legible; never centre everything.

Motion, all on a shared 20s master loop so nothing syncs into a visible beat:

| Element | Motion |
| --- | --- |
| rectangles | drift ±8px, rotate ±2°, staggered phases |
| rings | slow continuous rotation, 40s and 55s, opposite directions |
| blob | scale 1.0 ↔ 1.06, 18s |
| grid | parallax drift, half the speed of the rectangles |
| whole group | ±6px vertical float, 26s |

Nothing pulses, nothing bounces, nothing loops in under 15s. The panel should
read as *alive*, never as *animating*.

### Layer 3 — the copy

One line of display type plus one supporting line, bottom-left, on
`--on-board`. Copy changes per route; each `page.tsx` passes `variant` to
`AuthAside` so the layout stays a Server Component (no `usePathname`).

### Hard rules

- **Zero JavaScript.** All of it is CSS and inline SVG in Server Components. No
  `useEffect`, no animation library, no `"use client"`. A decorative animation
  that costs bundle size is a bad trade.
- **`prefers-reduced-motion: reduce` → completely still.** Not slower. Every
  `animation` declaration lives inside
  `@media (prefers-reduced-motion: no-preference)`, so static is the default
  and motion is the enhancement. Static must still look composed — it is a
  finished poster, not a paused video.
- **Animate `transform`, `opacity` and `background-position` only.** Never
  `width`/`height`/`x`/`y`/`filter` — they force layout or re-raster every frame.
- **`will-change` on at most two elements.** More costs more than it saves.
- Every animated element gets `aria-hidden="true"`. The panel contributes no
  heading and no alt text; layer 3's copy is real text.
- **Budget: 14KB** of inline SVG markup, and the panel must not push the page
  past a 60fps frame budget on a mid-range laptop. If either breaks, cut shapes
  — do not externalise the file and add a request.
- Contrast: check `--on-board` against the **lightest** point the gradient ever
  reaches mid-animation, not the average.

### What it is not

Not the miniature assembling kanban board from revision 1. That was literal and
it dated quickly. Abstract shapes age better and do not promise a specific UI.

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

### 6.2 `/sign-in` — two-step, code first

**Step 1 — email**

| Field | `autocomplete` |
| --- | --- |
| Email | `username` |

- **Remember me** checkbox, here on step 1 — session length is a property of the
  session, not of the password. 30-day cookie vs session cookie. Default off.
- Button: **Continue**
- Divider, then the social **grid** (§6.6)
- Foot: *Can't log in?* → `/forgot-password` · *Create an account* → `/sign-up`

> **Step 1 never calls the server.** It validates the email's shape on the
> client and advances. Trello's equivalent performs an account lookup, which
> tells an attacker whether an address is registered — an enumeration oracle on
> an unauthenticated endpoint. We keep the two-step *feel* and drop the oracle.
> The single credential check happens on step 2 submit.
>
> Consequence: we cannot route an SSO-only account before step 2. Acceptable —
> there is no SSO in v1. If it lands later, route on the email's **domain** (a
> config list), never on a per-account lookup.

**Step 2 — prove it**

The email is shown as static text with a **Change** button that returns to step
1 and refocuses the email field. A hidden `email` input keeps the value in the
payload and lets password managers associate the credential pair.

Step 2's field area is a **slot with two modes**:

```
┌─ mode: code (default) ────────────┐   ┌─ mode: password ──────────────┐
│  ◀ alex@tizello.dev      Change   │   │  ◀ alex@tizello.dev    Change │
│                                    │   │                               │
│  We sent a 6-digit code to your    │   │  Password                     │
│  inbox.                            │   │  [__________________]  Show   │
│  [_][_][_]  [_][_][_]              │   │                               │
│                                    │   │  [        Log in         ]    │
│  [        Log in         ]         │   │                               │
│  Resend code (60s)                 │   │  Use a login code instead     │
│  Use a password instead            │   │  Can't log in?                │
└────────────────────────────────────┘   └───────────────────────────────┘
```

| Mode | Field | `autocomplete` |
| --- | --- | --- |
| code *(default)* | 6 digits | `one-time-code` |
| password | password | `current-password` |

Code rules:

- **Six digits, numeric.** One `<input inputmode="numeric" maxlength="6">` that
  renders as six boxes, **not six inputs** — six inputs break paste, break
  screen-reader navigation, and fight the iOS/Android SMS-style autofill.
- Paste of a 6-digit string fills it and submits.
- Auto-submit when the sixth digit lands. Never auto-submit a partial value.
- **Resend** disabled 60s with a visible countdown.
- Codes expire in **10 minutes**, are single-use, and are invalidated by a
  successful sign-in or a new code request.
- `Use a password instead` switches mode client-side. It is a link, not a
  round-trip. Shown always — we cannot look up whether a password exists (that
  would be the enumeration oracle again).
- *Can't log in?* appears **here too**. This is where people actually get stuck,
  not on step 1.

Both steps and both modes live in **one client component**
(`sign-in-form.tsx`) holding `step` and `mode`. It is a leaf; `page.tsx` stays a
Server Component.

Focus management: advancing to step 2 focuses the first code box; **Change**
returns focus to the email field; switching mode focuses the new field. Announce
every step and mode change through a polite live region — a sighted user sees
the swap, a screen-reader user must be told.

> **v1 has no mail server.** The fixture in `src/lib/auth.ts` "sends" the code
> by logging it to the server console and accepting the literal `000000`. §9
> records what the backend must actually do. Do not ship the literal.

### 6.3 `/forgot-password` — "Can't log in?"

Heading: **Can't log in?**
Field label: *We'll send a recovery link to*
Button: **Send recovery link**
Link: *Return to log in*

Trello's copy here is better than ours and we use it as-is. "Recovery" is
broader and more honest than "reset password" — the common failure is not
knowing *which* method you used, not just forgetting a string.

One field: Email (`autocomplete="username"`).

> **Always render the same success state**, whether or not the address exists:
> *If an account exists for that address, a recovery link is on its way.*
> Anything conditional is an enumeration oracle. The server must return the same
> response and take roughly the same time either way (§9).

Success view replaces the form: confirmation text, the address it went to, and a
**Resend** button disabled for 60s with a visible countdown.

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

### 6.6 Social buttons — a grid

Google and GitHub, identical treatment on `/sign-in` and `/sign-up`:

```
──────────── or continue with ────────────
      ┌──────────┐  ┌──────────┐
      │ G Google │  │ ⌥ GitHub │
      └──────────┘  └──────────┘
```

- **Two up in a grid**, not stacked full-width. Notion's layout: five methods fit
  in two short rows where Trello's stack needs five. A third provider wraps to a
  second row rather than lengthening a wall.
- Google first — highest completion rate everywhere.
- **Below** the email form, under a divider. Above it, OAuth becomes the default
  path and we stop collecting email addresses.
- 40px tall, `border-border bg-surface`, brand mark left of a centred label.
- They are `<a>` elements to `/api/auth/oauth/{provider}/start?next=…`, not
  buttons — an OAuth start is a navigation.
- **In v1 that endpoint does not exist.** They render, are keyboard-reachable,
  and are marked `aria-disabled="true"` with a *Coming soon* tooltip until the
  backend lands. Do not stub a fake OAuth flow.

**Account linking must be decided before OAuth ships.** The same email arriving
via Google and via password has to resolve to **one** account. Retrofitting that
rule means merging live accounts; decide it in §9's contract first.

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
| POST | `/login/request-code` | `{ email }` | `202` *(always)* | 429 |
| POST | `/login/verify-code` | `{ email, code, remember }` | `200 { user }` + `Set-Cookie` | 401 `CODE_INVALID`, 410 `CODE_EXPIRED`, 429 |
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
- **Login codes: 6 digits, cryptographically random, stored hashed, single-use,
  10-minute expiry.** Invalidated by a successful sign-in or a newer request.
  Cap attempts at **5 per code**, then burn it — six digits is only 10⁶, so
  without an attempt cap a code is brute-forceable in seconds.
- `/login/request-code` returns `202` for unknown addresses, same as
  `/forgot-password`, and pads response time to a constant.
- **Account linking:** an OAuth identity whose verified email matches an existing
  account **links to it** rather than creating a second account. Never link on an
  unverified email — that is an account-takeover primitive. Decide and implement
  this before the first OAuth provider ships.
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
- **login codes: `request-code` logs the code to the server console and the
  fixture accepts the literal `000000`.** Never ship that literal; §14 has an
  acceptance check for it.
- every call sleeps 200–400ms so loading states are real

---

## 11. Components

Per `.claude/rules/ui-components.md`: server by default, `"use client"` only at
leaves, 150 lines hard cap.

| File | Kind | Notes |
| --- | --- | --- |
| `app/(auth)/layout.tsx` | server | the two-panel grid |
| `app/(auth)/*/page.tsx` | server | metadata, session redirect, composition |
| `components/auth/auth-aside.tsx` | server | right panel: composes the three layers + copy, `variant` prop |
| `components/auth/auth-shapes.tsx` | server | the animated geometric SVG, layer 2 (§5) |
| `components/ui/code-input.tsx` | **client** | 6-digit code: one input rendered as six boxes |
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

`sign-in-form.tsx` now holds two axes of state (`step` **and** `mode`) and will
certainly exceed 150 lines. Plan for the split up front: extract
`sign-in-email-step.tsx`, `sign-in-code-step.tsx` and `sign-in-password-step.tsx`,
and leave only the machine in the parent.

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
- [ ] Right panel ships **zero** JavaScript and is completely still under
      `prefers-reduced-motion: reduce`, while still looking composed
- [ ] Panel animation holds 60fps on a mid-range laptop; no layout-triggering
      properties animated
- [ ] The `000000` fixture code is gone before any real deployment
- [ ] Pasting a 6-digit code fills and submits; the code field is one input,
      not six
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
4. **Account linking rule** (§9) — needs deciding before OAuth ships, not after.
5. **Work-email helper text** — Notion nudges toward an org email because it has
   a teams model. We do not yet. Copying the line without the feature is cargo
   cult; leave it out until workspaces exist?
5. **`/verify-email` auto-redirect** — 2s is a guess. Some find it abrupt.

---

## 16. Build order

Each step is independently reviewable and leaves the app in a working state.

1. Types, validation rules, `lib/auth.ts` fixtures, `lib/actions/auth-actions.ts`
2. `(auth)/layout.tsx` + `auth-aside` + `auth-header` + the panel's three
   layers, **static** — composition first, motion in step 9
3. `text-field`, `password-field`, `checkbox`, `password-strength`
4. `/sign-up` end to end
5. `/sign-in`: step 1, then step 2 in **password** mode end to end
6. `/forgot-password` + `/reset-password`
7. `/verify-email` three states
8. `proxy.ts` route protection + sign out
9. `code-input` + step 2's **code** mode, mode switching, resend cooldown
10. Animate the panel — gradient drift, shapes, parallax — and the
    reduced-motion path
11. Full a11y and both-themes pass against §14
