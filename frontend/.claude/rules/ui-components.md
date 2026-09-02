# Rule — UI components

Applies to everything under `src/components/` and `src/app/`.
Styling tokens are a separate concern: see `DESIGN-SYSTEM.md`.

---

## 1. Server Components by default

**Every component is a Server Component unless it cannot be.** Do not add
`"use client"` to make something work — add it only when the component itself
needs one of:

- `useState`, `useReducer`, `useEffect`, `useSyncExternalStore`, or any hook
- an event handler (`onClick`, `onChange`, `onError`, `onSubmit`)
- browser-only APIs (`window`, `document`, `localStorage`, `IntersectionObserver`)
- a third-party library that needs any of the above

If none of those apply, it stays on the server.

## 2. The hybrid rule — push `"use client"` to the leaves

A page with one interactive button is **not** a client page. Move the button
into its own file, mark that file `"use client"`, and import it from the server
page. `"use client"` marks a *boundary*: the file and everything it imports ship
to the browser. One misplaced directive at the top of a page sends the whole
tree.

```tsx
// ❌ the entire page becomes client-side for one button
"use client";
export default function BoardPage() {
  const [open, setOpen] = useState(false);
  return (
    <main>
      {/* 200 lines of static markup, all shipped to the browser */}
      <button onClick={() => setOpen(true)}>Add card</button>
    </main>
  );
}
```

```tsx
// ✅ components/board/add-card-button.tsx — the client leaf
"use client";
export function AddCardButton() {
  const [open, setOpen] = useState(false);
  return <button onClick={() => setOpen(true)}>Add card</button>;
}

// ✅ app/board/[id]/page.tsx — stays a Server Component
import { AddCardButton } from "@/components/board/add-card-button";
export default async function BoardPage() {
  const board = await getBoard();      // runs on the server, no API round-trip
  return (
    <main>
      {/* static markup, zero JS */}
      <AddCardButton />
    </main>
  );
}
```

**Passing server data down is fine.** Props cross the boundary as long as they
are serialisable — strings, numbers, plain objects, arrays, `Date`. Functions,
class instances and `Symbol`s are not.

**Children slot through.** A Client Component can render server-rendered
`children` it never sees the source of:

```tsx
<ClientProvider>
  <ServerRenderedList />   {/* stays on the server */}
</ClientProvider>
```

Reach for that before converting a subtree.

**When you do write a client leaf,** name the file for what it does
(`add-card-button.tsx`, not `client-button.tsx`) and keep it small — it is a
direct cost to the bundle.

## 3. Images — always `AppImage`

`src/components/ui/app-image.tsx` is the only image component. It wraps
`next/image` and fixes the three house rules in one place, so no call site
repeats them:

| Rule | How |
| --- | --- |
| Full quality | `quality={100}`, hard-coded |
| Lazy by default | `loading="lazy"` unless overridden |
| Fallback | `onError` swaps to `/image-fallback.svg` |

```tsx
import { AppImage } from "@/components/ui/app-image";

<AppImage src="/board-cover.png" alt="Sprint board cover" width={272} height={160} />
```

Rules:

- **Never write a raw `<img>`.** ESLint fails the build on it
  (`@next/next/no-img-element`). Raw tags skip optimisation, lazy loading and
  CLS protection.
- **`alt` is required.** Decorative image? `alt=""`, never omitted.
- **Always give `width` + `height`, or `fill` inside a positioned parent.**
  Missing dimensions cause layout shift.
- **With `fill`, always set `sizes`.** Without it the browser downloads the
  largest candidate.
- **Above-the-fold hero only:** `loading="eager"` plus `preload`. Everything
  else stays lazy. In Next 16 `priority` is deprecated — use `preload`.
- **Remote images need a `remotePatterns` entry** in `next.config.ts`. Add the
  host; do not reach for `unoptimized`.
- **Static imports get a blur placeholder for free** — `placeholder="blur"`
  needs no `blurDataURL`. Remote sources must supply one.

`quality={100}` is set in `next.config.ts` via `qualities: [100]`, which is an
allowlist: any image omitting the prop is coerced up to 100 rather than the
Next default of 75. AVIF/WebP output keeps the byte cost sane.

`AppImage` is a Client Component only because `onError` is a function prop and
cannot cross the RSC boundary. It is a leaf — **importing it does not make the
importing page a Client Component.**

## 4. 150 lines, hard cap

No component file exceeds **150 lines** (blank lines and comments excluded).
`max-lines` in `eslint.config.mjs` fails the build.

The cap is a smell detector, not a formatting rule. When a file approaches it,
the fix is almost always one of:

- Extract a repeated block into a sibling component.
- Move a lookup table or constant array to the top of the file, or its own module.
- Split a page into sections — see `src/components/design-system/` for the
  worked example: a 235-line page became a 46-line composition root plus five
  focused section files.

Do **not** get under the cap by deleting comments or collapsing formatting.

## 5. Component conventions

- **One exported component per file** — plus its own small helpers if they are
  used nowhere else. File name is the component in `kebab-case`
  (`add-card-button.tsx` → `AddCardButton`).
- **Named exports**, not default — except `app/` files, where Next requires a
  default export (`page.tsx`, `layout.tsx`, `error.tsx`, …).
- **Props typed inline** for one or two props; a named `type` above the
  component beyond that. No `interface` for props, no `React.FC`.
- **No `any`.** No `@ts-expect-error` without a comment saying why.
- **Destructure props in the signature** with defaults, so the contract is
  readable at a glance.
- **Style with Tailwind utilities only.** No `style={{}}` except for genuinely
  dynamic values (a computed drag transform, a progress width).
- **Compose class names as complete strings.** Never interpolate a Tailwind
  class — see `DESIGN-SYSTEM.md`.

## 6. Accessibility — not optional

- Interactive elements are `<button>` / `<a>`, never a `<div>` with `onClick`.
  A `<button>` inside a form needs an explicit `type`.
- Every icon-only control needs `aria-label`.
- Custom widgets carry the right `role` + `aria-*` (see `ThemeToggle`'s
  `radiogroup`).
- Never `outline-none` without a replacement. The 2px focus ring is set once in
  the base layer.
- Headings descend in order; don't skip a level to get a font size.

## 7. Where components live

```
src/components/
  ui/              # generic primitives, no domain knowledge
                   #   button.tsx, app-image.tsx, theme-toggle.tsx
  board/           # feature components, know about boards/lists/cards
                   #   board-column.tsx, card-tile.tsx, add-card-button.tsx
  layout/          # app shell — top bar, sidebar, nav
```

`ui/` never imports from `board/`. Feature folders may import from `ui/`.
A component used by two features moves up to `ui/`.
