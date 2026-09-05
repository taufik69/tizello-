<!--
  Skeleton for docs/api/<module>.md — copy, rename, replace every <module> /
  <Module>, and answer every _italic prompt_ (then delete the prompt).

  A prompt you cannot answer is a decision nobody has made yet. Make it now,
  in the doc, rather than discovering it later in the code.

  Delete any section that genuinely does not apply — but say so in one line
  ("Nothing in this module is cached, because …") rather than leaving a gap a
  reader has to interpret.

  See .claude/skills/api-contract-doc/SKILL.md
  Gold standard: auth.md
-->

# <Module> API Contract

Module: `src/modules/<module>/`
Route prefix: `/api/v1/<module>s`

> **Sibling-contract check:** response envelope, `AppError`/validation-error
> shapes, guard middleware names (`authGuard`, `loadMembership`,
> `requirePermission`), and the rate-limiter precedent all match
> _<name the sibling docs you actually compared against, e.g. `task.md`, `workspace.md`>_
> exactly.
>
> <Module> diverges from the sibling modules in the following deliberate ways:
>
> 1. **_<Divergence>._** _<Why. Name the alternative you rejected and what it
>    would cost — that is what stops someone "fixing" this later.>_
> 2. **_<Divergence>._** _<Why.>_
>
> _<If there are none, say so explicitly: "No divergences — this module follows
> the sibling pattern exactly." An empty section reads as unchecked.>_

---

## <Domain> model — read this before any endpoint below

_<What must be understood before the endpoints make sense. Delete the ones
that do not apply, and keep the heading either way.>_

- **_<What identifies an entity here.>_** _<Is it an id, a slug, a compound
  key? Is it stable? Can it be reused after deletion?>_
- **_<Normalization applied before any layer below the validator sees the
  value.>_** _<e.g. emails lowercased and trimmed in the validator, so
  service, repository and Postgres only ever see one form. State what happens
  to a value that fails the pattern — a 400, not a lookup miss.>_
- **_<Entity states and the legal transitions between them.>_** _<e.g. an
  invitation is pending → accepted | expired | revoked; which of those are
  reachable from an endpoint, and which only from a job.>_
- **_<Ownership and scoping.>_** _<What scopes a row — a workspace? a user?
  Where does that scope come from: the path, the token, or the membership row?
  Never the body.>_

---

## Tokens / sessions

_<Delete unless this module issues, rotates, or revokes credentials.>_

| | _<Token A>_ | _<Token B>_ |
|---|---|---|
| Secret | `<ENV_VAR>` | `<ENV_VAR>` |
| Lifetime | `<ENV_VAR>` (e.g. `15m`) | `<ENV_VAR>` (e.g. `7d`) |
| Payload | `{ }` | `{ }` |
| Stored server-side | _<no / yes — hash only>_ | |
| Reusable | _<yes, until expiry / no — single-use>_ | |

_<Then prose: what revocation actually does, and what a stolen token buys an
attacker before it stops working.>_

## <Verification / OTP / invitation> policy

_<Delete unless applicable.>_

| Setting | Env var | Default |
|---|---|---|
| _<Code length>_ | `<ENV_VAR>` | `<n>` |
| _<Lifetime>_ | `<ENV_VAR>` | `<n>` (_<human form>_) |
| _<Resend cooldown>_ | `<ENV_VAR>` | `<n>` |
| _<Max attempts>_ | `<ENV_VAR>` | `<n>` |

_<Prose: what happens when a limit is hit — is the code destroyed, the account
locked, or just the request refused? Say which, and what the user must do
next.>_

## Rate limiting

_<Which limiters apply and why the abuse profiles differ. If every endpoint
uses the same limiter, say that and why one profile is enough.>_

| Limiter | Window / max | Applied to | Why |
|---|---|---|---|
| `<limiter>` | _<15 min / 100>_ | _<endpoints>_ | _<the abuse it exists to stop, and why a different limiter would be wrong here>_ |

## Account enumeration

_<Mandatory wherever an endpoint could reveal that an account, workspace, or
invitation exists. Delete only if nothing here takes a user-supplied
identifier for an entity the caller may not be allowed to see.>_

- `<endpoint>` answers _<status + exact message>_ whether _<the missing case>_
  **or** _<the wrong-credential case>_.
- `<endpoint>` answers `200` with the same body for _<unknown>_, _<already
  handled>_, and _<the real case>_. _<State what side effect is skipped in the
  first two — no email sent, no row written.>_
- _<Any endpoint that deliberately DOES distinguish, and why the user needs to
  be told.>_

**Known residual oracle.** _<Name any leak you are knowingly leaving open —
timing, a cooldown that only exists for real accounts, a distinguishable
error. Say why closing it would cost more than it buys, and what bounds it in
the meantime. If there is genuinely none, write "None known." — do not delete
the heading.>_

## Caching

_<Namespace, TTL, and what invalidates it. Or the explicit negative: "Nothing
in this module is cached, because …" — a silent absence gets 'corrected'.>_

## <Policy> failure modes

_<For any policy with an external dependency — Redis, a mail or SMS gateway, a
captcha verifier. This table is what gets read during an incident.>_

| Condition | Behaviour | Why |
|---|---|---|
| _<dependency not configured>_ | _<pass through / refuse>_ | _<why that is the safe direction here>_ |
| _<dependency unreachable>_ | _<fail open, logged / fail closed, 503>_ | _<what the alternative would break>_ |

---

## Auth

_<Which middleware protects these routes, in order, and what that order buys.
Name what is NOT used and why — e.g. "authGuard only, no requirePermission:
every endpoint acts on the caller's own account, resolved from req.user.id,
never from the body.">_

---

## 1. `<METHOD> /api/v1/<module>s<path>`

_<One line: what it does. Who can call it — Public / any member /
`requirePermission(PERMISSIONS.X)`. Which limiter applies.>_

**Body**

| Field | Rules |
|---|---|
| `<field>` | _<type, trimmed?, bounds, required?>_ |

_<Prose for anything non-obvious above: why a cap is that number, why a field
is validated server-side as well as in the browser, which fields are
immutable after create.>_

**`<200 | 201>`**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "<Module> fetched successfully",
  "data": {}
}
```

_<Prose for what the shape cannot carry: what is deliberately NOT returned and
why; what a repeat call does (idempotent? conflict? overwrite?); what happens
when two callers race; which side effects are queued rather than awaited, and
what the client should therefore not assume has happened yet.>_

**Errors**

| Status | When |
|---|---|
| `400` | validation failure — `data: [{ field, message }]` |
| `401` | _<missing / invalid credentials>_ |
| `403` | _<authenticated, but the role lacks the permission — name it>_ |
| `404` | _<not found — and if this is 404-instead-of-403 for enumeration safety, say so here>_ |
| `409` | _<uniqueness violation or illegal transition — exact message if the wording matters>_ |
| `429` | _<which limiter>_ |

---

## 2. `<METHOD> /api/v1/<module>s<path>`

_<Repeat the shape above. Number every endpoint; separate with `---`.>_
