# Plan — Custom project properties

Notion's "+ Add a property": a user-defined column with a type, added to the
project database and filled in per project.

## 1. What already exists

- `Project` — fixed columns (`name`, `key`, `status`, `priority`, `icon`,
  `color`, `description`, `startDate`, `endDate`) and **no JSON column**. The
  validator whitelists every field, so `PATCH {"budget": 5000}` is a
  `400 "budget" is not allowed` today.
- `docs/api/project.md` — the contract this extends, not replaces.
- `Workspace.settings Json?` — the precedent for storing free-form shape in
  Json rather than columns, and the reasoning is the same one §2.2 uses.
- `Membership` / `ProjectMember` — what a `PERSON` property validates against.

## 2. Design decisions

### 2.1 Definitions are per WORKSPACE, values are per PROJECT

The single most important fork, and the easy answer is wrong.

The easy answer is one `properties Json?` on `Project` holding both the name,
the type and the value. It fails immediately:

- Renaming "Budget" to "Cost" means rewriting every project row.
- A property added on one project does not exist on the others, so the list
  view has no column to show and the picker has nothing to offer.
- Two projects can disagree about what type "Budget" is.

Notion's actual model is a **database schema** plus **per-page values**, and
that is what this copies:

| | Lives on | Why |
|---|---|---|
| Definition (name, type, options, order) | `ProjectPropertyDef`, keyed by `workspaceId` | Listed, renamed, reordered, deleted — it needs to be a queryable row. |
| Value | `Project.properties Json?`, keyed by definition id | Only ever read alongside its project. A row per value would be a join on every list query to fetch data nothing filters on yet. |

So adding a property in one project adds the **column** to every project in the
workspace, and each fills in its own value. That is what "add a property to the
database" means, and it is what the screenshots show.

### 2.2 Values are Json, deliberately, and this is the one place that is right

A `ProjectPropertyValue` table would allow `WHERE budget > 5000`. Nothing
filters or sorts on a custom property today, and the cost of the table is a
join on every project read plus N inserts when a property is added to a
workspace with N projects.

The Json column costs one thing: no query can reach inside it. When filtering
on custom properties is actually wanted, Postgres `jsonb` indexing covers it
without a migration — the column is `Json`, which Prisma maps to `jsonb`.

**Adding a definition writes no project rows at all.** A project with no entry
for a definition renders Empty, which is the same thing a null value renders.

### 2.3 Type is immutable after create

`PATCH /properties/:id` accepts `name` and `options`, never `type`.

Changing `TEXT` → `NUMBER` has to answer "what happens to the 40 projects
whose value is `"about a week"`" — silently drop, refuse, or store a broken
value. All three are worse than making the user delete the property and add a
new one, which states the data loss instead of hiding it. Same reasoning as
the project `key` being immutable (`project.md` §*Key* 5).

### 2.4 Deleting a definition leaves its values in place

Removing a definition is one `DELETE` on one row. It does **not** rewrite the
`properties` Json of every project in the workspace.

Orphaned values are invisible: the DTO emits a value only when its definition
still exists, so a deleted property is gone from every response the moment the
definition is. The cost is dead weight in the Json, and the payoff is that
deleting a property is O(1) rather than O(projects) — and that a delete
undone by re-adding the property is at least *possible* to implement later.
Purging them is the same open question `project.md` already tracks for
soft-deleted rows.

### 2.5 Nine types, not twenty — and the omissions are the interesting part

Supported, because each is a value that can be stored and validated:

| Type | Stored as | Validated |
|---|---|---|
| `TEXT` | string | ≤2000 |
| `NUMBER` | number | finite |
| `SELECT` | string | must be one of `options` |
| `MULTI_SELECT` | string[] | every entry in `options` |
| `DATE` | string | `YYYY-MM-DD` |
| `CHECKBOX` | boolean | — |
| `URL` | string | `http`/`https` URI |
| `EMAIL` | string | RFC-ish, same rule as auth |
| `PHONE` | string | ≤32, loose on purpose |

**Not supported, each for a specific reason rather than for time:**

- **Formula** needs an expression parser and evaluator, a dependency graph, and
  a recalculation story on every write. It is a feature, not a property type.
- **Rollup** needs Relation first.
- **Relation** needs a second entity to relate to. Tasks do not exist yet.
- **Files & media** needs object storage and an upload pipeline. This app has
  neither — `.claude/rules/ui-components.md` notes there is no image source
  anywhere in it.
- **Person** is *deferred*, not refused: the value would be a `userId`
  validated against `Membership`, which is straightforward, but the frontend
  has no member picker because `GET /workspaces/:id/members` does not exist.
  Shipping the type without a way to pick a person is shipping a text box.
- **Created time / Created by / Last edited time / Last edited by / ID** are
  not custom properties at all. They are `createdAt`, `ownerId`, `updatedAt`
  and `key`, which the project already returns — the frontend draws them as
  read-only rows. Adding them as *definitions* would mean two sources for one
  fact.

### 2.6 `options` is only meaningful for SELECT and MULTI_SELECT

Validated as absent-or-empty for every other type rather than ignored: a
`TEXT` property carrying six colour swatches nobody renders is a lie the next
reader has to disprove.

Each option is `{ id, label, color }`. `id` rather than matching on `label` so
renaming an option does not orphan every value that used it.

### 2.7 Where the endpoints live

Definitions are workspace-scoped (`/workspaces/:workspaceId/properties`),
because that is what they belong to. Values ride on the existing
`PATCH /projects/:projectId` as one more field, because they are part of the
project — a second endpoint would make "save the project" two requests that
can half-fail.

## 3. Schema

```prisma
enum PropertyType {
  TEXT NUMBER SELECT MULTI_SELECT DATE CHECKBOX URL EMAIL PHONE
}

model ProjectPropertyDef {
  id          String       @id @default(cuid())
  workspaceId String
  workspace   Workspace    @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  name        String
  type        PropertyType
  // SELECT / MULTI_SELECT only: [{ id, label, color }]. Null everywhere else.
  options     Json?
  // Sparse (10, 20, 30…) so a reorder is one UPDATE, not a renumber.
  position    Int
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt

  @@unique([workspaceId, name])
  @@index([workspaceId])
  @@map("project_property_defs")
}
```

Plus `properties Json?` on `Project` — a `{ [defId]: value }` map.

`@@unique([workspaceId, name])` because two columns called "Budget" in one
database is a UI nobody can read. A `P2002` on it is a `409`.

## 4. Endpoints

| # | Method | Path | Guard | Who |
|---|---|---|---|---|
| 1 | GET | `/workspaces/:workspaceId/properties` | `loadMembership` + `PROJECT_VIEW` | any member |
| 2 | POST | `/workspaces/:workspaceId/properties` | + `PROJECT_MANAGE_ANY` | OWNER/ADMIN |
| 3 | PATCH | `/workspaces/:workspaceId/properties/:propertyId` | + `PROJECT_MANAGE_ANY` | OWNER/ADMIN |
| 4 | DELETE | `/workspaces/:workspaceId/properties/:propertyId` | + `PROJECT_MANAGE_ANY` | OWNER/ADMIN |

**Editing the schema is admin-only, editing a value is not.** Adding a column
changes the shape of every project in the workspace; filling one in changes one
project. A plain MEMBER who may create a project may therefore set its
properties (`requireProjectWrite`, unchanged) and may not add a new one.

## 5. Value validation

`PATCH /projects/:id` gains `properties` — a partial map, merged over the
stored one, `null` deleting a key.

The service loads the workspace's definitions and validates each incoming value
against its own type. **A value for an unknown definition id is a `422`**, not
a silent drop: it means the client is out of date with the schema, and a
silently discarded save is the worst possible answer to that.

## 6. Files

```
prisma/schema.prisma                                (edit)
prisma/migrations/<ts>_project_properties/          (new)
src/shared/constants/propertyTypes.js               (new — the type table both validator and service read)
src/modules/project/project-property.validator.js   (new)
src/modules/project/project-property.repository.js  (new)
src/modules/project/project-property.service.js     (new)
src/modules/project/project-property.controller.js  (new)
src/modules/project/project-property.routes.js      (new)
src/modules/project/project.dto.js                  (edit — emit `properties`)
src/modules/project/project.validator.js            (edit — accept `properties`)
src/modules/project/project.service.js              (edit — merge + validate)
src/routes/index.js                                 (edit — mount)
docs/api/project-property.md                        (new)
```

**Six files, and they are a second module in the same folder** rather than
growing `project.*.js`. `module-consistency` asks for six files per module;
these are a module (their own routes, their own service, their own validator)
that happens to live beside the project's because they are meaningless apart
from it. The alternative — folding four endpoints and nine value validators
into the existing six files — puts `project.service.js` past 400 lines.

## 7. Failure modes

| Condition | Behaviour | Why |
|---|---|---|
| Duplicate name in one workspace | `409` | Two identical columns is unreadable. |
| `type` in a PATCH | `400` | Immutable (§2.3). |
| `options` on a non-select type | `400` | §2.6. |
| A `SELECT` value not in `options` | `422` | The option was deleted or the client is stale. |
| A value for an unknown definition | `422` | Client is out of date; a silent drop hides it. |
| Wrong shape for the type (`"abc"` for NUMBER) | `422` | — |
| Deleting a definition | `200`, values orphaned | §2.4. |
| Non-admin adds a property | `403` | §4. |

## 8. Open questions

1. **Purging orphaned values.** §2.4 leaves them. A background job that strips
   keys with no definition is the fix, alongside the soft-delete purge
   `project.md` already tracks.
2. **Filtering and sorting by a custom property.** Needs `jsonb` indexing and a
   query syntax. The column type already supports it.
3. **Person, Files, Relation, Formula.** §2.5 — each blocked on a specific
   missing thing, not on effort.
