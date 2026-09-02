# Rule — pages, routing and file structure

Component-level rules live in `.claude/rules/ui-components.md`.
Colour, type and spacing tokens live in `DESIGN-SYSTEM.md`.

---

## File structure

```
src/
  app/                     # routing ONLY — one folder per URL segment
    layout.tsx             #   root shell: <html>, fonts, theme script
    page.tsx               #   /
    board/[boardId]/
      page.tsx             #   /board/:boardId
      loading.tsx          #   streaming fallback for this segment
      error.tsx            #   error boundary for this segment
    api/                   #   route handlers, only when a real HTTP endpoint
  components/
    ui/                    # generic primitives, no domain knowledge
    board/                 # feature components
    layout/                # app shell — top bar, sidebar, nav
  lib/                     # data access, helpers, pure logic
  types/                   # shared TS types when they outgrow their module
public/                    # static assets served from /
```

Rules:

- **`app/` holds routing files only** — `page`, `layout`, `loading`, `error`,
  `not-found`, `route`, `template`, `default`. Everything else lives in
  `components/` or `lib/`. A `page.tsx` is a composition root: it fetches data
  and arranges components. It does not define them.
- **Files are `kebab-case`.** `add-card-button.tsx`, not `AddCardButton.tsx` —
  case-insensitive filesystems make mixed casing a real source of broken imports.
- **Import with `@/`**, never `../../..`.
- **Co-locate what only one route uses** in that route's folder — but if it is a
  component, it still goes under `components/`, not inside `app/`.
- **`lib/` is framework-agnostic.** No JSX, no `next/*` imports beyond types.

## Checklist for a new page

Work through this in order.

**1. Route**
- Folder name = URL segment, lowercase. Dynamic segments are `[boardId]`.
- Grouping without affecting the URL? Use a route group: `(marketing)/`.

**2. Server Component by default**
- `page.tsx` must be a Server Component. Interactivity goes in client leaves.
  Never put `"use client"` in a `page.tsx`.

**3. `params` and `searchParams` are Promises — `await` them**
```tsx
export default async function BoardPage({ params }: PageProps<'/board/[boardId]'>) {
  const { boardId } = await params;
  // …
}
```
`PageProps<'/route'>` and `LayoutProps<'/route'>` are globally available after
type generation — do not import them, and do not hand-write the props type.

**4. Fetch on the server**
- `await` your data directly in the component. No `useEffect` + `fetch`, no
  client-side loading state for initial data.
- Fetch in the component that needs it. Two components needing the same data is
  fine — requests are deduped within a render.
- Never call your own `/api` route from a Server Component. Call the function.

**5. `metadata`**
- Every page exports `metadata`, or `generateMetadata` when it depends on
  `params`. `title` + `description` at minimum.
- The root layout sets a `title.template`, so a page's `title` is just its own
  name.

**6. `loading.tsx` and `error.tsx`**
- Any route that awaits data gets a `loading.tsx` — otherwise navigation blocks
  on the slowest fetch.
- Any route that can fail gets an `error.tsx`. It must be a Client Component
  (`"use client"`) and accept `{ error, reset }`.
- Prefer `<Suspense>` around the slow part over a whole-page `loading.tsx` when
  the rest of the page can render immediately.

**7. Not found**
- Call `notFound()` for a missing record. Don't render an empty shell.

**8. Before calling it done**
- [ ] `npm run build` passes — type errors fail the build
- [ ] `npm run lint` passes — includes the 150-line cap
- [ ] No `"use client"` above a leaf
- [ ] Every colour is a semantic token — flip to dark and check
- [ ] Every image is `AppImage` with `alt` and dimensions
- [ ] Keyboard: tab through it; focus is visible everywhere
- [ ] Narrow the viewport to 360px — nothing overflows horizontally

## Data and mutations

- **Reads** happen in Server Components.
- **Writes** use Server Actions (`"use server"`), not a hand-rolled `/api`
  route. Revalidate with `revalidatePath` / `revalidateTag` after a mutation.
- **Route handlers (`app/api/`) are for real HTTP endpoints only** — webhooks,
  third-party callbacks, or something a non-browser client consumes.
- **Validate every input at the server boundary.** Client-side validation is a
  convenience, never a control.
- **Never read a secret in a Client Component.** Anything in a `"use client"`
  file, or passed as a prop into one, is public. Only `NEXT_PUBLIC_*` env vars
  belong in the browser.

## TypeScript

- `strict` stays on. No `any`; use `unknown` and narrow.
- Type what crosses a boundary (props, function signatures, API payloads). Let
  inference handle locals.
- `type` for object shapes; `interface` only when declaration merging is needed.
- `as const` for lookup tables and literal arrays.

## Performance

- Ship as little JS as possible — that is what the server-first rule buys.
- `next/font` only. No `<link>` to a font CDN: it costs a round-trip and risks
  layout shift.
- `next/dynamic` for genuinely heavy client-only widgets (a drag-and-drop
  engine, a rich-text editor), not as a default.
- `key` on list items is a stable id, never the array index, wherever the list
  can reorder — which, on a Trello board, is everywhere.

## Never commit

`.env*`, credentials, API keys, tokens, private keys, or a real user's data in a
fixture.
