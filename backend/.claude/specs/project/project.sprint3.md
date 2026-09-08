# Sprint 3 — Write path: update, archive, delete, limiter, contract doc

**Plan sections:** 5, 8, 9 · **Depends on:** 2 · **Blocks:** 4

## Goal

A project can be edited, archived, unarchived and soft-deleted by the right
people and nobody else — and `docs/api/project.md` exists, because
`CLAUDE.md` says a module without its contract doc is not a module.

## Tasks

### 3.1 `projectCreateLimiter` — `src/shared/middlewares/rateLimiter.js`

- [ ] `failClosed(limiter({ name: 'projectCreate', windowMs: 60 * 60 * 1000,
      max: 30 }))`, added to the default export beside the others.
- [ ] One comment line on why 30 and not the workspace's 10 (plan §9).
- [ ] Swap it onto `POST /workspaces/:workspaceId/projects`, replacing the
      placeholder `apiLimiter` from sprint 2.

### 3.2 Service — update / archive / delete

- [ ] `updateProject(project, patch)` — the validator already rejected an
      empty body and already excluded `key`. No re-validation here.
- [ ] `setArchived(projectId, isArchived)` — reversible, both directions
      through the same endpoint. Archiving does **not** touch `status`; they
      are independent axes (plan §2.1 correction 1).
- [ ] `deleteProject(projectId)` — sets `deletedAt`, never a hard delete,
      never touches `ProjectMember` rows (purge policy is an open question,
      plan §11.3). A second delete of the same project → `404`, because every
      read already filters `deletedAt: null`.
- [ ] Still no `taskCounter` read or write anywhere.

### 3.3 Controller + routes

- [ ] `update`, `archive`, `remove` — through `ApiResponse`, `200` each.
- [ ] Routes 4, 5, 6 from plan §5:
      - `PATCH /projects/:projectId` → `loadProject` + `requireProjectWrite`
        + `validate(updateProjectSchema)`
      - `PATCH /projects/:projectId/archive` → same guards +
        `validate(archiveProjectSchema)`
      - `DELETE /projects/:projectId` → `loadProject` + `requireProjectOwner`
- [ ] Guard order unchanged: limiter → guard → `loadProject` → role guard →
      validate → handler.

### 3.4 `docs/api/project.md`

- [ ] Follow [api-contract-doc](../../skills/api-contract-doc/SKILL.md);
      `docs/api/auth.md` is the reference for depth, `docs/api/workspace.md`
      for a module of this size.
- [ ] Must state the **why**, not just shapes. At minimum:
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
- [ ] Endpoint table must match `project.routes.js` exactly — including the
      sprint-4 endpoints, marked as not yet implemented rather than omitted.

## Definition of done

Verified against a running server, with real users in real roles.

- [ ] `PATCH /projects/:id` — project OWNER `200`; project MANAGER `200`;
      workspace ADMIN who is not a project member `200` (the escape hatch);
      workspace MEMBER with a COLLABORATOR row `403`; workspace MEMBER with
      no row `403`; non-member of the workspace `404`.
- [ ] Empty `PATCH` body → `422` from the validator.
- [ ] `PATCH` with `key` → rejected.
- [ ] `PATCH .../archive { isArchived: true }` → project disappears from the
      default list, reappears with `includeArchived=true`, `status`
      unchanged; `{ isArchived: false }` restores it.
- [ ] `DELETE /projects/:id` — project OWNER `200`; project MANAGER `403`;
      workspace ADMIN `200`; repeat delete `404`, not `200`.
- [ ] After delete: absent from list, `GET` by id `404`, and the row still
      exists in Postgres with `deletedAt` set.
- [ ] 31st create inside an hour → `429`; with Redis stopped, create →
      `429` (fail closed), matching every other limiter.
- [ ] `docs/api/project.md` exists and its endpoint table matches the router
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
