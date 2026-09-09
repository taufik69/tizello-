# `project-property` — API contract

**Module:** `src/modules/project/project-property.*` ·
**Route prefix:** `/api/v1/workspaces/:workspaceId/properties`

> **Sibling-contract check.** Response envelope, `AppError` shape,
> validation-error shape, guard middleware names and rate-limiter precedent all
> match [project.md](./project.md) and its siblings: `{ success, statusCode,
> message, data }` from `ApiResponse`, services throwing `AppError` with a
> `data.code`, `validate` producing `400` with a per-field `details` array, and
> `authGuard` / `loadMembership` / `requirePermission`.
>
> **Deliberate divergences, three of them:**
>
> 1. **A second module inside `modules/project/`.** `module-consistency` asks
>    for six files per module and this is a seventh through twelfth file in the
>    same folder. They are a module — own routes, own service, own validator —
>    that is meaningless apart from the project's. Folding four endpoints and
>    nine value validators into the existing six would put
>    `project.service.js` past 400 lines.
> 2. **No soft delete.** Every other model here stamps `deletedAt`. A property
>    definition is workspace *schema*, not user content: a "deleted but
>    recoverable" column still has to be filtered out of every project
>    response, which is indistinguishable from being gone.
> 3. **Values are Json, definitions are rows.** See §*Where things live*. This
>    is the one place in the codebase where a Json column is the right answer
>    rather than the lazy one, and the reasoning is spelled out below because
>    the opposite choice is the more obvious one.

---

## Where things live — read this before any endpoint below

| | Stored in | Why |
|---|---|---|
| **Definition** — name, type, options, order | `project_property_defs` rows, keyed by `workspaceId` | Listed, renamed, reordered, deleted. It has to be queryable. |
| **Value** — what one project put in that column | `projects.properties`, a `{ [defId]: value }` `jsonb` map | Only ever read alongside its project. |

**Definitions belong to the WORKSPACE, not to a project.** Adding a property
adds the column to every project in the workspace, and each fills in its own
value — that is what "add a property to the database" means, and it is the
whole reason this is not a `properties` blob carrying names and types per
project. That shape fails immediately: renaming "Budget" would rewrite every
project row, a property added on one project would not exist on the others, and
two projects could disagree about what type "Budget" is.

**Adding a definition writes no project rows at all.** A project with no entry
for a definition renders as empty, which is what a null value renders as
anyway.

**A value table was considered and rejected.** It would allow
`WHERE budget > 5000`; nothing filters or sorts on a custom property today, and
the cost is a join on every project read plus N inserts every time a property is
added to a workspace with N projects. When filtering is actually wanted,
Postgres `jsonb` indexing covers it with no migration — the column is already
`jsonb`.

### Deleting a definition leaves its values behind

`DELETE` removes one row. It does **not** rewrite the `properties` map of every
project in the workspace.

Orphaned values are invisible: a project response emits a value only when its
definition still exists, so a deleted property is gone from every response the
moment the definition is. The cost is dead weight in the Json; the payoff is
that deleting a property is O(1) rather than O(projects). Purging is an open
question, the same one `project.md` tracks for soft-deleted rows.

### `type` is immutable

`PATCH` accepts `name`, `options` and `position`. Never `type`.

`TEXT` → `NUMBER` has to answer what happens to the forty projects whose value
is `"about a week"` — silently drop, refuse, or store something broken. All
three are worse than making the user delete the property and add a new one,
which states the data loss rather than hiding it. Same call as `Project.key`
(`project.md` §*Key* 5).

---

## Types

Nine, and the omissions are the interesting part.

| Type | Value shape | Rule |
|---|---|---|
| `TEXT` | string | ≤2000 characters |
| `NUMBER` | number | finite — `NaN` and `Infinity` do not survive JSON |
| `SELECT` | string | must be an option **id** |
| `MULTI_SELECT` | string[] | every entry an option id |
| `DATE` | string | `YYYY-MM-DD`, and a date that exists — `2026-02-31` is rejected |
| `CHECKBOX` | boolean | — |
| `URL` | string | parses, and the scheme is `http` or `https` — `javascript:` is rejected |
| `EMAIL` | string | shape only, ≤254. Looser than the auth module's on purpose: this is a label on a project, not a login, so a rejected address costs data entry and buys nothing |
| `PHONE` | string | ≤32 and nothing else. Every phone regex ever written rejects somebody's real number |

**Not offered, each blocked on a specific missing thing rather than on effort:**

- **Formula** needs an expression parser, an evaluator, a dependency graph and
  a recalculation story on every write. It is a feature, not a property type.
- **Rollup** needs Relation first.
- **Relation** needs a second entity to relate to. Tasks do not exist yet.
- **Files & media** needs object storage and an upload pipeline; this app has
  neither.
- **Person** is deferred rather than refused — the value would be a `userId`
  validated against `Membership`, which is easy, but there is no
  `GET /workspaces/:id/members` for a picker to read, and shipping the type
  without one ships a text box.
- **Created time / Created by / Last edited time / Last edited by / ID** are
  not custom properties. They are `createdAt`, `ownerId`, `updatedAt` and
  `key`, which a project already returns; the frontend draws them as read-only
  rows. Defining them here would be two sources for one fact.

### `options`

Meaningful for `SELECT` and `MULTI_SELECT` only, and **rejected with a `400`
on every other type** rather than ignored — a `TEXT` property carrying six
colour swatches nobody renders is a lie the next reader has to disprove.

```json
{ "id": "apac", "label": "APAC", "color": "#579dff" }
```

`id` is client-supplied and is what a value stores, so renaming a `label` does
not orphan every value that used it. Max 50 per property, ids unique.

`options` comes back as `[]` for the two types that have them and `null` for
the seven that do not, so a client can branch on the type alone.

---

## Guards

| Action | Guard | Who |
|---|---|---|
| Read the schema | `loadMembership` + `requirePermission(PROJECT_VIEW)` | any workspace member |
| Create / update / delete a definition | `+ requirePermission(PROJECT_MANAGE_ANY)` | workspace OWNER / ADMIN |
| Set a **value** | unchanged — `loadProject` + `requireProjectWrite` on `PATCH /projects/:id` | project owner, MANAGER, or workspace OWNER/ADMIN |

**Editing the schema is admin-only; editing a value is not.** Adding a column
changes the shape of every project in the workspace; filling one in changes one
project. A plain workspace MEMBER who owns a project may therefore set its
properties and may not invent a new one for everybody — verified, both ways.

`apiLimiter` (15m / 100) on all four. No dedicated limiter: schema edits are
rare and already admin-gated, which is a tighter bound than a rate limit.

---

## 1. `GET /api/v1/workspaces/:workspaceId/properties`

The workspace's project-database schema, ordered by `position` then
`createdAt`.

**`200`**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Properties fetched",
  "data": {
    "properties": [
      {
        "id": "cmtscsobs00011cj27mt6zisd",
        "workspaceId": "cmtqvsgqp0005s4j2j2w4d35e",
        "name": "Region",
        "type": "SELECT",
        "options": [{ "id": "apac", "label": "APAC", "color": "#579dff" }],
        "position": 20,
        "createdAt": "2026-09-08T07:31:00.000Z",
        "updatedAt": "2026-09-08T07:31:00.000Z"
      }
    ]
  }
}
```

**Errors:** `404` not a workspace member · `429`.

---

## 2. `POST /api/v1/workspaces/:workspaceId/properties`

| Field | Rules |
|---|---|
| `name` | string, 1–60, trimmed, required, unique within the workspace |
| `type` | one of the nine, required, immutable afterwards |
| `options` | required-shape for `SELECT`/`MULTI_SELECT` (defaults `[]`); **must be absent or empty** for every other type |

Appended to the end of the list — `position` is the current maximum plus 10.
Sparse steps so a later reorder is one `UPDATE` rather than a renumber.

**`201`** — `{ "data": { "property": { … } } }`.

**Errors**

| Status | When |
|---|---|
| `400` | Validation failed — including `options` on a non-select type, and an unknown `type`. |
| `403` | Not a workspace OWNER/ADMIN. |
| `404` | Not a workspace member. |
| `409` | `CONFLICT` — a property with that name already exists here. Two columns called "Budget" is a UI nobody can read. |
| `429` | `RATE_LIMITED`. |

---

## 3. `PATCH /api/v1/workspaces/:workspaceId/properties/:propertyId`

`name`, `options` and `position`, all optional, at least one required. An empty
body is a `400`.

**`type` is not accepted** — see §*`type` is immutable*.

`options` is checked against the **stored** type, because the request does not
carry one: that is the half of the options-belong-to-select rule the validator
structurally cannot enforce, and it is a `422` rather than a `400` for the same
reason.

Renaming a property does **not** touch any project's values — they key on the
definition's id.

**Errors:** `400` · `403` · `404` · `409` duplicate name · `422` options on a
non-select type · `429`.

---

## 4. `DELETE /api/v1/workspaces/:workspaceId/properties/:propertyId`

Removes the definition. Values are orphaned rather than rewritten, and vanish
from every project response immediately — see §*Deleting a definition*.

**`200`** — `{ "message": "Property deleted", "data": null }`.

**Errors:** `403` · `404` · `429`.

---

## 5. Values — on `POST` and `PATCH /api/v1/projects/:projectId`

Both gain one field:

```json
{ "properties": { "<definitionId>": <value> } }
```

- **Partial.** Only the keys being changed are sent; the rest of the stored map
  is untouched.
- **`null` deletes a key.** It is the only way to clear a property, and it is
  what the frontend's "remove this row" sends.
- **An unknown definition id is a `422`**, never a silent drop: it means the
  client is out of date with the workspace's schema, and discarding the save
  without saying so is the worst possible answer to that.
- **A wrong-shaped value is a `422` naming the property** — `"Budget must be a
  number"`, not `"properties.cmts… failed"`. The message is built from the
  definition's own name.
- Validated **before the insert** on create, so a create carrying a bad value
  writes no project at all.

Every project response now carries `properties`, filtered to definitions that
still exist. It is `{}` on a project that has set none.

---

## Open questions

1. **Purging orphaned values.** §*Deleting a definition* leaves them. A job
   that strips keys with no definition is the fix, alongside the soft-delete
   purge `project.md` already tracks.
2. **Filtering and sorting by a custom property.** Needs `jsonb` indexing and a
   query syntax. The column type already supports it; nothing else does yet.
3. **Person, Files, Relation, Formula, Rollup.** See §*Types* — each is blocked
   on a specific missing thing.
4. **Reordering.** `position` is patchable and sparse, but no endpoint moves
   several properties at once. A drag-to-reorder UI would want one.

---

## Files

```
prisma/schema.prisma                                ProjectPropertyDef, PropertyType, Project.properties
src/shared/constants/propertyTypes.js               the type table both validators read
src/modules/project/project-property.routes.js
src/modules/project/project-property.controller.js
src/modules/project/project-property.service.js     includes mergeProperties, called by project.service.js
src/modules/project/project-property.repository.js
src/modules/project/project-property.dto.js
src/modules/project/project-property.validator.js
src/modules/project/project.dto.js                  emits `properties`, filtered to live definitions
src/modules/project/project.validator.js            accepts `properties`
src/modules/project/project.service.js              merges values, loads definitions for every read
src/routes/index.js                                 mount
```

Reasoning behind every decision above:
[`.claude/plan/project-property.md`](../../.claude/plan/project-property.md).
