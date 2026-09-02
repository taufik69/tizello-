# Spec — auth UX analysis: Trello vs Notion

**Status:** accepted. Notion's flow chosen; split-panel layout kept.
Folded into `.claude/specs/authentication.md` revision 2 — that spec is now the
build document, this one is the reasoning behind it.
**Date of observation:** Sept 2026
**Relates to:** `.claude/specs/authentication.md` — §7 below lists what this
would change there.

Everything in §1–§3 was observed directly in a browser. §1.4 is the one gap:
Notion's step 2 requires submitting an email address to a third party, which I
did not do. It is marked as unverified.

---

## 1. Trello — what it actually does

`trello.com/login` and `trello.com/signup` both **redirect off-domain** to
`id.atlassian.com`. Trello has no auth of its own; it is an Atlassian ID client.

### 1.1 Log in

```
        ┌──────────────────────────┐
        │      [Trello logo]       │
        │    Log in to continue    │
        │  Email *                 │
        │  [____________________]  │
        │  □ Remember me  ⓘ        │
        │  [      Continue      ]  │
        │      Or login with:      │
        │  [ 🔑  Passkey        ]  │
        │    Or continue with:     │
        │  [ G   Google         ]  │
        │  [ ⊞   Microsoft      ]  │
        │  [ 🍎  Apple          ]  │
        │  [ #   Slack          ]  │
        │  Can't log in? · Create  │
        │       an account         │
        │  ── ATLASSIAN ──         │
        └──────────────────────────┘
   illustrations flanking, far left and right
```

- Centred card, ~320px content column, on `#FAFBFC`.
- **Two-step**: email → Continue → password screen.
- Six sign-in methods on one screen, in three labelled groups.
- Input 36px, primary button 40px, social buttons 40px stacked full-width.

### 1.2 Sign up

Email only, then Continue. Terms are static text, not a checkbox. Same four
social buttons. No name or password on this screen.

### 1.3 Can't log in

Separate page. Heading **"Can't log in?"**, one field labelled *"We'll send a
recovery link to"*, button **Send recovery link**, and a *Return to log in*
link.

Note the framing: **recovery**, not "reset password". It covers a forgotten
password *and* a forgotten which-method-did-I-use, which is the more common
real problem.

### 1.4 What I could not verify

Step 2 of Trello's login (the password screen) requires submitting an email.
Not done. From step 1's markup it is a password field plus a submit; the
`Remember me` checkbox is already collected on step 1.

---

## 2. Notion — what it actually does

`notion.so/login` → `app.notion.com/login`. **Same brand throughout.**

### 2.1 Log in

```
        ┌────────────────────────────────┐
        │         [Notion logo]          │
        │      Your AI workspace.        │
        │   Log in to your Notion account│
        │  Email                         │
        │  [__________________________]  │
        │  Use an organization email to  │
        │  easily collaborate with team… │
        │  [        Continue          ]  │
        │  ──── or continue with ────    │
        │  ┌──────┐ ┌──────┐ ┌────────┐  │
        │  │Google│ │Apple │ │Microsoft│ │
        │  └──────┘ └──────┘ └────────┘  │
        │      ┌────────┐ ┌──────┐       │
        │      │Passkey │ │ SSO  │       │
        │      └────────┘ └──────┘       │
        │      New user? Sign up         │
        │  By continuing… Terms · Privacy│
        └────────────────────────────────┘
                Language: English (US)
```

- Centred card, no illustration at all.
- Email-first, single field, `Continue`.
- **Social as a 3-up grid**, not a stack. Five methods occupy two short rows
  instead of five full-width bars.
- **No "forgot password" link.** See §3.2.
- Helper text under the field does product work (team discovery), not legal work.

### 2.2 Sign up

Same card, presented as a **modal over a blurred skeleton of the Notion app** —
you can see where you are going before you commit.

- Field is labelled **"Work email"**, placeholder `name@company.com`.
- A grey tip callout: *"Use your work email (if you have one) so it's easier for
  your team to join you on Notion."*
- Social row is Google / Microsoft / **ChatGPT** — no Apple, and an OIDC
  provider Trello does not offer.
- Terms are static text. *Existing user? Log in.*

### 2.3 What I could not verify

Notion's step 2. Its published behaviour is an emailed **login code** with a
password as an alternative where one is set — that is why there is no
forgot-password link. **Treat as unverified.** If we adopt the code path, verify
it first-hand before building.

---

## 3. Comparison

### 3.1 Side by side

| | Trello (Atlassian ID) | Notion |
| --- | --- | --- |
| Domain | **leaves trello.com** | stays in-brand |
| Branding on the page | Atlassian, not Trello | Notion |
| Step 1 | email (+ remember me) | email |
| Step 2 | password | login code / password *(unverified)* |
| Social layout | 4 stacked, full-width | 3-up grid + 2 |
| Methods on screen | 6 | 5 |
| Passkey | own labelled group | in the grid |
| SSO | not offered here | first-class button |
| Recovery link | **visible: "Can't log in?"** | **absent** |
| Remember me | explicit checkbox | not shown |
| Signup fields | email | email |
| Signup framing | legal text | product tip |
| Signup backdrop | flanking illustrations | blurred app preview |
| Language switcher | no | yes |

### 3.2 Where each one wins

**Notion is better at:**

1. **Removing the password from the critical path.** The single largest cause
   of failed logins is a forgotten password. A code sent to the address you just
   typed cannot be forgotten. This is the whole ballgame — it is why Notion needs
   no recovery link.
2. **Brand continuity.** Trello hands you to a page branded *Atlassian* on a
   different domain. That is a trust dip at the exact moment you are typing a
   credential, and it is the classic shape of a phishing page.
3. **Scannability of providers.** Five buttons in a 3+2 grid is two rows. Four
   stacked full-width bars is a wall, and on a phone it pushes everything below
   it off-screen.
4. **Doing product work with helper text.** "Use your work email so your team can
   find you" earns its line. Trello's equivalent space holds terms boilerplate.
5. **Showing the destination.** The blurred app behind the signup modal answers
   "what am I signing up for" before the form does.

**Trello is better at:**

1. **Discoverable recovery.** "Can't log in?" is right there. Notion's absence of
   it is only safe *because* the code path exists — remove that and the design
   collapses.
2. **Framing it as recovery, not password reset.** Broader and more honest about
   what users actually lose.
3. **Explicit "Remember me".** A visible control over session length beats an
   invisible default.
4. **Giving Passkey its own labelled group.** It is a different *kind* of thing
   from OAuth; the grid flattens that distinction.

### 3.3 Verdict

**Notion's flow is the better model, and it is not close.** Its structural
choice — identity proven by a code to the address you just typed — deletes an
entire failure branch rather than decorating it. Trello's flow is a competent
version of a design that still assumes passwords are the primary key.

But Notion's flow is only safe with working transactional email, and it hides
recovery in a way that is wrong for anyone who *does* have a password.

**Take Notion's shape, keep Trello's explicitness, and keep neither's layout.**

Both products centre a card. We do not: Tizello uses a split panel, form left,
animated composition right. That is a product decision from the brief, not a
finding from this analysis — neither Trello nor Notion supports it as the better
choice. It is recorded here so nobody later reads this document as endorsing a
centred card.

---

## 4. Recommendation for Tizello

### 4.1 Adopt from Notion

- **Stay on our own domain.** Never redirect to an auth vendor's branded page.
- **Social providers in a grid**, not a stack.
- **Helper text earns its place** — nudge toward a work email, do not restate
  the terms.
- **Terms as static text**, never a checkbox we cannot back with a stored
  consent record.
- **One question per screen.** Email first, always.

### 4.2 Adopt from Trello

- **A visible recovery link on the sign-in screen**, labelled *"Can't log in?"*
  rather than *"Forgot password?"*.
- **An explicit Remember me control**, not a silent default.

### 4.3 Reject from both

- **Trello's off-domain redirect** — the single worst thing in either flow.
- **Trello's six methods on one screen.** Two OAuth providers is enough until
  someone asks for more.
- **Notion's missing recovery link.** Correct for their flow, wrong for ours.

### 4.4 The path we should be on — **decided**

**Code-first from v1.** The earlier draft of this section proposed shipping
passwords first and demoting them in v2. That was wrong, for one reason: the
slot design it recommended is the expensive part, and building the slot while
deliberately leaving it half-empty means writing the hard bit twice.

```
Email  ──▶  ┌─ 6-digit code to your inbox   (default)
            └─ "Use a password instead"     (link, always shown)
```

The objection was that we have no mail server. That is real but not blocking:
the code path is a **frontend flow plus a contract**, exactly like every other
call in `src/lib/auth.ts`. The fixture logs the code to the server console and
accepts `000000`; `authentication.md` §9 records what the backend must do, and
§14 has an acceptance check that the literal is gone before deployment.

Password stays as a permanent fallback, not a transitional one. `Use a password
instead` is always visible — we cannot look up whether an account *has* a
password without recreating the enumeration oracle we removed in §4.1.

**Sequencing inside v1:** build step 2 in password mode first (it is the simpler
of the two and proves the machine), then add code mode. That is
`authentication.md` §16 steps 5 and 9.

### 4.5 Screen-by-screen

| Screen | Decision |
| --- | --- |
| `/sign-in` step 1 | Email + **Remember me** + Continue. Social grid below a divider. *Can't log in?* and *Create an account* at the foot. |
| `/sign-in` step 2 | Email echoed as static text with **Change**. **Code input by default**, `Use a password instead` switching mode client-side. *Can't log in?* repeated here — this is where people actually get stuck. |
| `/sign-up` | Name, email, password on one screen. Helper text nudges a work email. Terms static. Social grid. |
| `/forgot-password` | Heading **"Can't log in?"**, field labelled *"We'll send a recovery link to"*, button **Send recovery link**. Trello's copy is better than ours; use it. |
| `/reset-password` | Unchanged from `authentication.md`. |
| `/verify-email` | Unchanged. |

### 4.6 OAuth

| Question | Decision |
| --- | --- |
| Providers | **Google + GitHub.** Dev-tool audience. Not Apple (no iOS app), not Microsoft (no enterprise story yet), not Slack. |
| Layout | Grid. Two buttons side by side; a third would wrap to a second row. |
| Order | Google first — highest completion rate everywhere. |
| Placement | **Below** the email form, under a divider. Above it, OAuth becomes the default path and we lose the email list. |
| Passkey | Not v1. When it lands, its **own labelled group**, Trello-style, not mixed into the OAuth grid. |
| SSO | Not v1. Needs an org model first. |
| Account linking | Same email via Google and via password resolves to **one** account. **Link only on a provider-verified email** — linking on an unverified one is an account-takeover primitive. Written into `authentication.md` §9; still needs sign-off before the first provider ships. |
| Failure | An OAuth error returns to `/sign-in` with a form-level message, never a blank callback page. |

---

## 5. Anti-patterns neither product commits

Worth naming so we do not invent them:

- No CAPTCHA on the happy path.
- No password strength requirements shouted before the user has typed.
- No auto-focus stealing on mobile that pops the keyboard over the form.
- No "we've sent you an email" screen without the address printed on it.
- No social buttons above the primary form.

---

## 6. Open questions

**Resolved since this was written:**

1. ~~Is v2 (code-first) actually planned?~~ **Yes, and it is v1, not v2.** §4.4.
2. ~~Account linking rule.~~ Decided: link only on a provider-verified email.
   Written into `authentication.md` §9; still needs sign-off before the first
   provider ships.

**Still open:**

3. **Work-email nudge** — Notion's *"Use your work email so it's easier for your
   team to join you"* only works because Notion has a teams model. We do not.
   Copying the line without the feature is cargo cult. Leave it out until
   workspaces exist?
4. **Language switcher** — Notion has one, Trello does not. Out of scope unless
   i18n is planned.
5. **Passkey** — both products offer it, we do not. When it lands it gets its
   own labelled group (Trello's treatment), not a slot in the OAuth grid: it is
   a different *kind* of credential and the grid flattens that.

## 7. What this changed in `authentication.md`

All applied in revision 2 of that spec.

| § | Change |
| --- | --- |
| 1 | Login code added to scope as the **default** sign-in path; password demoted to a fallback |
| 2 | Comparison table rewritten as a take-from-where table across both products |
| 4 | Shell diagram reconciled: social grid, Remember me on step 1, *Can't log in?* in the footer |
| 5 | Illustration replaced. Was a miniature assembling kanban board; now a three-layer composition — animated gradient field + noise, geometric SVG shapes, copy. Still zero JS, still still under reduced motion. |
| 6.2 | Two-step **code first**; step 2 is a two-mode slot; Remember me moved to step 1; *Can't log in?* repeated on step 2 |
| 6.3 | Heading becomes **"Can't log in?"**, field *"We'll send a recovery link to"*, button **Send recovery link** — Trello's copy taken verbatim |
| 6.6 | Social buttons become a **grid**, Google first, below the divider |
| 9 | `/login/request-code` and `/login/verify-code` added; code rules (6 digits, hashed, single-use, 10 min, **5-attempt cap**); account-linking rule |
| 10 | Fixture behaviour for codes, including the `000000` literal |
| 11 | `auth-shapes.tsx` and `code-input.tsx` added; `sign-in-form.tsx` pre-split into three step files |
| 14 | Acceptance checks for 60fps, reduced-motion stillness, paste-to-fill, and removing the `000000` literal |
| 16 | Build order re-sequenced: password mode (5) → code mode (9) → animation (10) |

Unchanged and still standing: the split-panel layout itself, the security
posture in §7–§10, and the enumeration defences in §6.2 and §6.3.
