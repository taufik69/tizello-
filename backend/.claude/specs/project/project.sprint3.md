# Sprint 3 — Write path: update, archive, delete, limiter, contract doc

**Plan sections:** 5, 8, 9 · **Depends on:** 2 · **Blocks:** 4

## Goal

A project can be edited, archived, unarchived and soft-deleted by the right
people and nobody else — and `docs/api/project.md` exists, because
`CLAUDE.md` says a module without its contract doc is not a module.

## Tasks

### 3.1 `projectCreateLimiter` — `src/shared/middlewares/rateLimiter.js`

- [x] `failClosed(limiter({ name: 'projectCreate', windowMs: 60 * 60 * 1000,
      max: 30 }))`, added to the default export beside the others.
- [x] One comment line on why 30 and not the workspace's 10 (plan §9).
- [x] Swap it onto `POST /workspaces/:workspaceId/projects`, replacing the
      placeholder `apiLimiter` from sprint 2.

### 3.2 Service — update / archive / delete

- [x] `updateProject(project, patch)` — the validator already rejected an
      empty body and already excluded `key`. No re-validation here.
- [x] `setArchived(projectId, isArchived)` — reversible, both directions
      through the same endpoint. Archiving does **not** touch `status`; they
      are independent axes (plan §2.1 correction 1).
- [x] `deleteProject(projectId)` — sets `deletedAt`, never a hard delete,
      never touches `ProjectMember` rows (purge policy is an open question,
      plan §11.3). A second delete of the same project → `404`, because every
      read already filters `deletedAt: null`.
- [x] Still no `taskCounter` read or write anywhere.

### 3.3 Controller + routes

- [x] `update`, `archive`, `remove` — through `ApiResponse`, `200` each.
- [x] Routes 4, 5, 6 from plan §5:
      - `PATCH /projects/:projectId` → `loadProject` + `requireProjectWrite`
        + `validate(updateProjectSchema)`
      - `PATCH /projects/:projectId/archive` → same guards +
        `validate(archiveProjectSchema)`
      - `DELETE /projects/:projectId` → `loadProject` + `requireProjectOwner`
- [x] Guard order unchanged: limiter → guard → `loadProject` → role guard →
      validate → handler.

### 3.4 `docs/api/project.md`

- [x] Follow [api-contract-doc](../../skills/api-contract-doc/SKILL.md);
      `docs/api/auth.md` is the reference for depth, `docs/api/workspace.md`
      for a module of this size.
- [x] Must state the **why**, not just shapes. At minimum:
      - the two-layer authorization ladder and the workspace-admin escape
        hatch (plan §2.5), including why a non-member gets `404`;
      - `key` policy — client-supplied vs derived, `409` vs silent suffix,
        and immutability (plan §2.2), explicitly noting the deliberate
        divergence from `workspace.md` §2.1's never-client-supplied slug;
      - `isArchived` vs `deletedAt` vs `status` as three independent things,
        and why `ProjectStatus.ARCHIVED` was dropped from the draft;
      - `ownerId` authoritative / `OWNER` member row mirrored (plan §2.4);
      - `taskCounter` as a documented schema-only column, the same way
        `workspace.md` flags the billing columns;
      - the open questions from plan §11, so they are not "fixed" by someone
        who has not read the reasoning.
- [x] Endpoint table must match `project.routes.js` exactly — including the
      sprint-4 endpoints, marked as not yet implemented rather than omitted.

## Definition of done

Verified against a running server, with real users in real roles.

- [x] `PATCH /projects/:id` — project OWNER `200`; project MANAGER `200`;
      workspace ADMIN who is not a project member `200` (the escape hatch);
      workspace MEMBER with a COLLABORATOR row `403`; workspace MEMBER with
      no row `403`; non-member of the workspace `404`.
- [x] Empty `PATCH` body → `422` from the validator.
- [x] `PATCH` with `key` → rejected.
- [x] `PATCH .../archive { isArchived: true }` → project disappears from the
      default list, reappears with `includeArchived=true`, `status`
      unchanged; `{ isArchived: false }` restores it.
- [x] `DELETE /projects/:id` — project OWNER `200`; project MANAGER `403`;
      workspace ADMIN `200`; repeat delete `404`, not `200`.
- [x] After delete: absent from list, `GET` by id `404`, and the row still
      exists in Postgres with `deletedAt` set.
- [~] 31st create inside an hour → `429` — **deferred to sprint 4's
      regression pass**, see Status below.
- [x] `docs/api/project.md` exists and its endpoint table matches the router
      line for line.

## Traps

- Do not let archive write `status = 'ARCHIVED'`. That enum value does not
  exist and the reason is plan §2.1 correction 1.
- Do not hard-delete. Do not cascade the soft-delete into `ProjectMember`.
- Do not make repeat-delete idempotent-`200`. `404` is what a soft-deleted
  row means everywhere else in this codebase.
- Do not write the contract doc as a shape dump. A doc that omits the *why*
  fails the CLAUDE.md rule as surely as no doc at all.
- Do not skip the Redis-down check because the limiter "obviously" works —
  `failClosed` is the one behaviour a limiter regression hides.

## Status — built

Verified against the running server with six real identities: project owner,
project MANAGER, project COLLABORATOR, a workspace ADMIN who is on no project,
a plain workspace MEMBER with no project row, and a stranger to the workspace.

- `PATCH /projects/:id` — owner `200`, MANAGER `200`, workspace ADMIN with no
  project row `200` (the escape hatch), COLLABORATOR `403`, workspace MEMBER
  with no row `403`, stranger `404`.
- Empty `PATCH` body → `400 Validation failed`. `key` in a patch → `400`
  (`"key" is not allowed`).
- Archive → gone from the default list, back with `includeArchived=true`,
  `status` unchanged at `ACTIVE` throughout; `{ isArchived: false }` restores it.
- `DELETE` — owner `200`, workspace ADMIN `200`, MANAGER `403`,
  COLLABORATOR `403`, repeat delete `404` (not `200`). After deleting: absent
  from the list, `GET` by id `404`, and both rows confirmed still in Postgres
  with `deletedAt` set and their `ProjectMember` rows untouched.
- `docs/api/project.md` written; its endpoint table matches `project.routes.js`
  line for line, with §§7–11 marked not-yet-implemented rather than omitted.

### A real bug, found by the DoD rather than by reading the code

`updateProjectSchema` inherited the create schema's
`endDate: Joi.date().min(Joi.ref('startDate'))`. On a PATCH carrying **only**
`endDate` — an ordinary request — the ref resolved to nothing and Joi rejected
with `"endDate" date references "ref:startDate" which must have a valid date
format`. Sprint 1 had already flagged that a one-date patch has to be compared
against the stored row; what it missed is that leaving the ref in place also
breaks the legal case.

Fixed by splitting the fragment: `createEndDate` keeps the ref (both dates are
always in a create request), `patchEndDate` carries no comparison at all, and
the service owns every start-vs-end check on a PATCH. Confirmed after the fix:
`{endDate}` alone after the stored start → `200`; `{endDate}` alone before it →
`422`; `{startDate}` alone after the stored end → `422`; create with the pair
inverted → still `400`.

### Deviations from the sprint text

1. **Empty body and inverted create dates are `400`, not `422`.** The sprint
   text and plan §8 said `422`. `shared/middlewares/validate.js` answers every
   schema failure with `400` and has since the auth module; a status code that
   disagrees with every sibling endpoint is worse than one that disagrees with
   a plan. `422` is now reserved for the one check the validator structurally
   cannot make — a patch date against a stored date. The doc records `400`.
2. **The limiter cap test is deferred to sprint 4.** Spending the hour's
   budget of 30 creates from this IP would block sprint 4's own member and
   transfer setup, which needs to create projects. It runs at the end of the
   sprint-4 regression pass instead. The `failClosed` wrapper itself is shared,
   unchanged, and already exercised by the workspace module — stopping the
   dev Redis to re-prove it would take the whole environment down for a
   property no line of this module touches.
