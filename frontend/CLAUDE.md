# Tizello — frontend

A Trello-style task management app. This package is the web client.

> **Scope: frontend only.** Never create, edit or delete anything under
> `../backend/`. Server Components and Server Actions inside this app are fine —
> the boundary is the `backend/` package, not server-side code. See
> [.claude/rules/scope.md](./.claude/rules/scope.md).

@AGENTS.md
@DESIGN-SYSTEM.md
@.claude/rules/scope.md
@.claude/rules/workflow.md
@.claude/rules/ui-components.md
@.claude/rules/pages-and-structure.md

## Build progress

> Keep this current — check items off as they ship.

What is actually in `src/`, not what is planned. Everything here is
frontend-only and fixture-backed: a checked box means the UI exists and works
against demo data in `src/lib/`, never that a backend is wired.

- [x] **Design system + theming** — tokens in `globals.css`, every colour a
      `light-dark()` pair, `ThemeToggle`. The reference page still occupies `/`.
- [x] **Auth** — sign-in (email → password or code), sign-up, forgot/reset
      password, verify email, sign-out. Server Actions over `auth-fixtures.ts`;
      `proxy.ts` does the optimistic cookie check.
- [x] **Workspace** — `/workspaces` grid, `/workspaces/[workspaceId]` detail,
      switcher, create dialog, sidebar shell.
- [x] **Members** — roster, role menu, remove-with-confirm, invite dialog,
      pending-invites tab, and the accept page at `/invite/[token]`.
- [ ] **Projects** — `/workspaces/[workspaceId]/projects` renders five
      URL-driven views (`?view=active|timeline|board|all|status`) over
      `demo-projects.ts`, plus the grid and create dialog on the workspace page.
      Every control in the toolbar is a `LockedControl`: no create, filter,
      sort, search or drag & drop. No project detail route, and boards are not
      scoped to a project. `Project` (workspace tile) and `ProjectRecord`
      (full record) are still two types.
- [ ] **Backlog** — `/board/backlog` renders with a working card composer, but
      it is one global backlog, not per-project.
- [ ] **Sprint** — `/workspaces/[workspaceId]/projects/[projectId]/sprints`
      lists five fixture sprints from `demo-sprints.ts`, grouped Active /
      Planning / Completed, with a create-and-edit dialog (`TextField
      type="date"` is the date input), start / complete confirms and
      delete-with-confirm. All `useState`: nothing persists past a refresh.
      `Sprint` (board stamp) and `SprintRecord` (full record) are two types.
- [ ] **Sprint planning** —
      `/workspaces/[workspaceId]/projects/[projectId]/sprint-planning` renders
      the backlog and the selected PLANNING sprint side by side, moves tasks
      between them by setting `sprintId`, totals story points against the
      sprint's `capacityPoints`, and confirms Start sprint in a dialog. Working
      search, priority filter and sort on the backlog side; no drag & drop.
      Every move is client state over `lib/sprint-planning.ts` — the pure
      helpers are shaped like `planIntoSprint()` / `closeSprint()` and their
      Server Actions, which remain complete, correct and still uncalled.
- [x] **Columns** — To do / In progress / Done, fixed on sprint boards, rendered
      by `BoardColumn` + `ColumnPill`. A card's column is its status.
      `BoardColumn` is the shell both boards share: pill, count, track, empty
      state and a `footer` slot for the composer, plus optional droppable
      wiring (`containerRef` / `isOver`) that the sprint board fills in.
- [x] **Sprint board + tasks** — `/board/sprint` renders the one ACTIVE sprint
      (SPR-13) from `demo-board.ts`: header with project, sprint, window and
      state badge; live done/total and points on the toolbar; three columns of
      task cards with id, priority, labels, points and assignee. **Drag & drop
      works** — `@dnd-kit/core` + `@dnd-kit/sortable`, pointer and keyboard,
      reorder within a column and move between them (which changes status),
      `DragOverlay` ghost and a dashed drop indicator on the landing column.
      A drop writes one float `position` (`lib/sprint-board.ts`), never a
      renumber. Detail dialog edits every field including the column, with
      empty-title validation and delete-with-confirm; a title-only quick add
      sits under each column. Filter / sort / search are `LockedControl`s and
      "Complete sprint" opens a confirm that changes nothing — `closeSprint` in
      `lib/sprint.ts` is still uncalled. All `useState`: nothing persists past
      a refresh.
- [ ] **Permissions** — roles are typed and shown (`RoleBadge`), and the owner is
      locked in the members UI; there is no permission helper and no action is
      gated by role.

## Stack

| Concern    | Choice                                        |
| ---------- | --------------------------------------------- |
| Framework  | Next.js 16 (App Router, Turbopack, `src/`)    |
| Language   | TypeScript (strict)                           |
| Styling    | Tailwind CSS v4 — CSS-first config, no `tailwind.config.js` |
| Font       | Inter, via `next/font/google`                 |
| Drag & drop| `@dnd-kit/core` + `@dnd-kit/sortable` (sprint board only) |
| Alias      | `@/*` → `src/*`                               |

```bash
npm run dev     # http://localhost:3000
npm run build
npm run lint
```

## Design system

Tokens were extracted from trello.com and reduced to a minimal set. They live in
`src/app/globals.css` as Tailwind v4 `@theme` blocks.

**Full reference: [DESIGN-SYSTEM.md](./DESIGN-SYSTEM.md)** — palette, type scale,
radii, elevation, the brand contrast rule, and the house rules for using them.
It is imported above, so it is always in context. Read it before writing any
markup.

Three things it is easy to get wrong:

- **Use the semantic layer, not the ramps** — `bg-surface`, not `bg-ink-0`.
  Ramp utilities are frozen in the light palette and break dark mode.
- **`brand-500` carries dark ink, never white** — `bg-brand-500 text-on-brand`.
- **Never interpolate a class name** — `` `bg-brand-${step}` `` won't exist.

## Light and dark mode

Both ship. The theme is `data-theme` on `<html>` — absent means follow the OS,
`"light"` and `"dark"` force it. Every themed colour is a single `light-dark()`
declaration in `globals.css`, so the two attribute rules re-resolve the whole
palette; there is no duplicated dark block.

| File | Role |
| --- | --- |
| `src/app/globals.css` | the `light-dark()` token values (block 3) |
| `src/lib/theme.ts` | `Theme` type, storage, `THEME_INIT_SCRIPT` |
| `src/components/ui/theme-toggle.tsx` | Light / Dark / System control |
| `src/app/layout.tsx` | inlines the init script into `<head>` |

**Write markup once.** If a component needs a `dark:` utility, a semantic token
is usually missing — add the token instead. Full mechanics, both neutral ramps,
and the hydration constraints are in
[DESIGN-SYSTEM.md § Themes](./DESIGN-SYSTEM.md#themes).

To check work: open `/` and flip the toggle. Anything that doesn't re-theme is
reaching past the semantic layer.

`/` currently renders the design-system reference page. Delete it once the real
board UI lands.

## Rules

Five rule files are imported above, so they are always in context. They are the
contract for this package — read them before writing code, not after review.

| File | Covers |
| --- | --- |
| [.claude/rules/scope.md](./.claude/rules/scope.md) | frontend only — `backend/` is off limits |
| [.claude/rules/workflow.md](./.claude/rules/workflow.md) | backlog → sprint planning → sprint board → close |
| [DESIGN-SYSTEM.md](./DESIGN-SYSTEM.md) | tokens, palette, type scale, themes |
| [.claude/rules/ui-components.md](./.claude/rules/ui-components.md) | server/client split, images, the 150-line cap, a11y |
| [.claude/rules/pages-and-structure.md](./.claude/rules/pages-and-structure.md) | file structure, new-page checklist, data fetching |

The four that get broken most often:

1. **Server Components by default.** `"use client"` marks a *boundary* — the
   file and everything it imports ships to the browser. One interactive button
   on a page means a client leaf in its own file, not a client page.
2. **Images go through `AppImage`** (`@/components/ui/app-image`) — quality 100,
   lazy, fallback on error. A raw `<img>` fails lint.
3. **150 lines per component**, enforced by `max-lines` in `eslint.config.mjs`.
4. **Semantic tokens only** — `bg-surface`, never `bg-ink-0`, or dark mode breaks.

`npm run lint` enforces 2–3. The rest is on review.

## Structure

```
src/
  app/            # routing ONLY — page/layout/loading/error + globals.css
  components/
    ui/           # generic primitives (app-image, theme-toggle)
    board/        # feature components (columns, cards, composer)
    layout/       # app shell
  lib/            # data access, helpers, pure logic
    actions/      # Server Actions — the one place lib/ may import next/*
  types/          # shared domain types
```

Routes so far: `/` design-system reference · `/board/[boardId]` the board —
`/board/sprint` is the sprint board, `/board/backlog` the flat one.
