# Tizello — frontend

A Trello-style task management app. This package is the web client.

> **Scope: frontend only.** Never create, edit or delete anything under
> `../backend/`. Server Components and Server Actions inside this app are fine —
> the boundary is the `backend/` package, not server-side code. See
> [.claude/rules/scope.md](./.claude/rules/scope.md).

@AGENTS.md
@DESIGN-SYSTEM.md
@.claude/rules/scope.md
@.claude/rules/ui-components.md
@.claude/rules/pages-and-structure.md

## Stack

| Concern    | Choice                                        |
| ---------- | --------------------------------------------- |
| Framework  | Next.js 16 (App Router, Turbopack, `src/`)    |
| Language   | TypeScript (strict)                           |
| Styling    | Tailwind CSS v4 — CSS-first config, no `tailwind.config.js` |
| Font       | Inter, via `next/font/google`                 |
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

Four rule files are imported above, so they are always in context. They are the
contract for this package — read them before writing code, not after review.

| File | Covers |
| --- | --- |
| [.claude/rules/scope.md](./.claude/rules/scope.md) | frontend only — `backend/` is off limits |
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

Routes so far: `/` design-system reference · `/board/[boardId]` the board
(`/board/sprint`).
