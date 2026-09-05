---
name: api-contract-doc
description: MUST BE USED when building or documenting any API module's endpoints — writing a new module, adding or changing an endpoint, altering a status code, a guard, a rate limiter, or a validation rule. Defines how we write docs/api/<module>.md - the per-module API contract that specifies every endpoint AND the reasoning behind each security and behavior decision. Write the contract BEFORE or ALONGSIDE the code, never after. A module without a current contract doc is not finished.
---

# API contract docs

Every backend module gets exactly one contract at `docs/api/<module>.md`.

It is not a list of shapes. Shapes can be read off the validator; what cannot
be recovered from code is **why** — why this endpoint answers 404 instead of
403, why this one is not cached, why the message is deliberately vague. A
contract that only restates the code has failed, because the next person to
touch the module will "fix" the very decisions it was supposed to protect.

**The gold standard is `auth.md`** — in this project once written, and today
`electrogadet_v2/backend/docs/api-contracts/auth.md`. Read it before writing a
new contract. Match its depth, its ordering, and its habit of answering the
objection a reader is about to raise. It is long because the module is subtle;
a CRUD module's contract is shorter, but never thinner in reasoning.

Start from `templates/contract-template.md`.

---

## Required sections, in this order

### 1. Header + sibling-contract check

Module path, route prefix, then a blockquote comparing this module to its
siblings on five axes: **response envelope, `AppError` shape,
validation-error shape, guard middleware names, rate-limiter precedent.**

State that they match — by name, citing the sibling docs. Then enumerate every
**deliberate divergence** as a numbered list, each with its justification.

This section exists so a divergence reads as a decision rather than an
oversight. "Nothing is cached here, unlike every sibling, because a stale hit
means a revoked token still answering" survives review; the same absence
undocumented gets silently 'corrected' by whoever adds caching next.

### 2. Domain / identity model

Anything that must be understood *before* the endpoints make sense: what the
identifier is, normalization rules applied before any layer sees the value,
account/entity states and which transitions are legal, ownership and scoping.

Head it `## <X> model — read this before any endpoint below`. If a reader can
start at section 5 without confusion, this section can be short — but say so
rather than omitting the heading.

### 3. Cross-cutting policies

One `##` section per policy, each with a settings table where it has knobs:

| | |
|---|---|
| Tokens / sessions | lifetimes, payloads, what is stored server-side, single-use vs reusable |
| OTP / verification | length, TTL, cooldown, max attempts |
| Rate limiting | a row per limiter: window/max, endpoints, **and a Why column** |
| Account enumeration | which endpoints could leak existence, and what each answers instead |
| Caching | namespace, TTL, what invalidates it — or an explicit "nothing here is cached, because…" |
| Captcha / challenges | thresholds, and the fail-open vs fail-closed table |

Settings tables carry **Setting | Env var | Default**. A default that appears
only in code is a default that will drift.

Where a policy can fail (Redis down, a third party unreachable), give a
`Condition | Behaviour | Why` table saying whether it fails open or closed.
That table is the most-consulted part of a contract during an incident.

### 4. Auth / guard summary

Which middleware protects these routes, and the exceptions. Say what is *not*
used and why — `authGuard only, no requireRole: every endpoint acts on the
caller's own account, resolved from req.user.id, never from the body`.

### 5. Per-endpoint sections, numbered

`## N. \`METHOD /full/path\``, numbered from 1, in the order a client would
meet them. Each one:

1. **One line**: what it does, who can call it (Public / any member /
   `requirePermission(X)`), and the rate limiter applied.
2. **Body** table — `Field | Rules`. Omit for endpoints with no body; use a
   Query or Params table where those are the input.
3. **Prose for anything non-obvious in that table** — why a cap is that
   number, why a field is validated server-side as well as client-side.
4. **Fenced JSON success example** with the real envelope, real-looking
   values, and the actual status in the heading (**`201`**, not "Response").
5. **Prose for the behavior a shape cannot carry**: what is deliberately
   *not* returned, what a repeat call does, what happens on a race.
6. **Errors** table — `Status | When`. The When cell carries the exact client
   message where the wording is load-bearing, plus the reasoning for any
   status a reader would question.

Separate endpoints with `---`.

---

## House rules

- **Every response uses `{ success, statusCode, message, data }`.** Examples
  must show the full envelope, never a bare payload. See
  `.claude/skills/api-response/SKILL.md` for the contract itself — this doc
  records how a module *uses* it, and never redefines it.
- **Document account-enumeration behavior explicitly** wherever an endpoint
  could reveal whether an account, workspace, or invitation exists. Say what
  each endpoint answers for the missing case, and name any **residual oracle**
  you are knowingly leaving open, with the reason and what bounds it. A leak
  you have written down is a decision; one you have not is a bug.
- **State the WHY, not just the WHAT.** Every deliberate divergence from a
  sibling module is justified in prose. Rule of thumb: if a reviewer could
  plausibly ask "shouldn't this be X?", answer it in the doc.
- **Cross-reference from the code.** The module's multi-line comment headers
  point at the doc (`See docs/api/<module>.md`), and the doc points back at
  files by path. Neither is browsable from the other otherwise.
- **One file per module**, at `docs/api/<module>.md`, named for the module
  folder (`src/modules/task/` → `docs/api/task.md`).
- **Written before or alongside the code.** A contract written afterwards
  documents what was built; written first, it is where the decisions actually
  get made — and the disagreements surface while they are still cheap.
- **Keep it current.** Changing a status code, guard, limiter, or validation
  rule means editing the doc in the same commit. A stale contract is worse
  than none: it is trusted.

---

## Depth: what "reasoned" means

Thin — restates the code, protects nothing:

> **Errors**
>
> | Status | When |
> |---|---|
> | `404` | Workspace not found |

Right — the next reader cannot "simplify" it without arguing with the reason:

> **Errors**
>
> | Status | When |
> |---|---|
> | `403` | Authenticated, a member, but the role lacks `member:invite`. |
> | `404` | Not a member — **not `403`**. Confirming that a workspace exists to someone with no access to it is itself the leak; a non-member and a nonexistent workspace must be indistinguishable. |

The difference is one sentence, and it is the whole value of the document.

---

## Checklist

- [ ] Lives at `docs/api/<module>.md`, one file, named for the module folder.
- [ ] Header names the module path and route prefix.
- [ ] Sibling-contract check covers all five axes; every divergence numbered
      and justified.
- [ ] Domain/identity notes present, or explicitly noted as unnecessary.
- [ ] Each cross-cutting policy has its own section; settings tables carry
      **Setting | Env var | Default**; failure modes state open vs closed.
- [ ] Guard summary says what protects the routes *and* what is not used.
- [ ] Every endpoint numbered, with method + full path, caller, limiter, body
      table, envelope-complete JSON example, and an errors table.
- [ ] Enumeration behavior documented wherever existence could leak; residual
      oracles named.
- [ ] Every non-obvious choice has a stated reason.
- [ ] Module code headers reference this doc; the doc references files by path.
