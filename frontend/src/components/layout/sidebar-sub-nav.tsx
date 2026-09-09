"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/cn";
import { childHref } from "@/lib/nav-links";
import { setMobileSidebarOpen } from "@/lib/sidebar";
import type { SidebarChildItem } from "@/types/nav";

/*
 * The expanded half of a sidebar group: one link per sub-view of the parent's
 * page, pointing at exactly the URLs the page's own view strip carries.
 *
 * Which one is current is a question about `?view=`, so this reads
 * `useSearchParams` — and is therefore rendered inside a `<Suspense>` by
 * `SidebarTreeItem`, which is what keeps the reading from opting the whole
 * route out of prerendering.
 *
 * Still `<a>`s in a `<ul>`, never `role="tab"`: each one navigates.
 *
 * A GUIDE LINE, NOT A BULLET PER ROW. Each child used to carry its own 4px dot,
 * which read as a list of four unrelated things that happened to be indented —
 * the indent was the only thing tying them to the parent, and an indent alone
 * is ambiguous next to a section label. One continuous hairline down the
 * group says "these belong to that" once, for all of them, which is what every
 * file tree does and why they are readable at a glance.
 *
 * IT SITS AT 16px, dead centre of the parent's icon slot
 * (`sidebar-tree-item.tsx` puts that at 8px, 16px wide), so the line drops out
 * of the middle of the glyph the group is named by rather than floating in the
 * gutter beside it. The labels then start at 32px — the parent's own label
 * position — so the two levels share one text edge.
 *
 * THE RAIL IS DRAWN PER ROW, NOT ONCE ON THE LIST, and that is a paint-order
 * fix rather than a preference. As one `::before` on the `<ul>` it sat BEHIND
 * the rows: each link is positioned (it has to be — it carries its own marker)
 * and comes later in tree order, so any row with a fill — the current one, or
 * merely a hovered one — punched a hole in the line. A segment on each row is
 * painted with that row, above its own background.
 *
 * `-bottom-0.5` IS EXACTLY THE 2px `space-y-0.5` GAP, so consecutive segments
 * meet and read as one continuous line. Not more: overshooting would push the
 * last row's segment past the group and into whatever follows it, which is the
 * one thing a guide line must not do — it would claim a sibling as a child.
 *
 * The current row's segment is the same line, 2px and brand-coloured, centred
 * on the 1px rail by `-translate-x-1/2`. The two are written as COMPLETE class
 * strings rather than a base plus overrides, because `cn` is a plain join (see
 * `lib/cn.ts` — no `tailwind-merge`): `before:w-0.5` after `before:w-px` would
 * be two utilities of equal specificity with stylesheet order picking the
 * winner, which is not something class order can decide.
 */
const LIST = "mt-0.5 space-y-0.5";
const BASE =
  "relative flex w-full items-center rounded-sm py-1 pr-2 pl-8 text-left text-xs transition-colors duration-100 ease-standard";
const IDLE = "text-text-muted hover:bg-surface-sunken hover:text-text";
const ACTIVE = "bg-surface font-medium text-text";

const RAIL =
  "before:absolute before:top-0 before:-bottom-0.5 before:left-4 before:w-px before:bg-border before:content-['']";
const RAIL_CURRENT =
  "before:absolute before:top-0 before:-bottom-0.5 before:left-4 before:w-0.5 before:-translate-x-1/2 before:rounded-full before:bg-brand-500 before:content-['']";

export function SidebarSubNav({
  id,
  labelledBy,
  parentHref,
  items,
  /** False when the parent's page is not the one on screen: nothing is current. */
  onPath,
}: {
  id: string;
  labelledBy: string;
  parentHref: string;
  items: readonly SidebarChildItem[];
  onPath: boolean;
}) {
  const searchParams = useSearchParams();

  /* Every child selects the same param, so the first one that names it names it
     for all. `current` is what the URL asks for; `known` is whether any child
     claims it — a junk `?view=nonsense` falls back to the default child, which
     is exactly how the page parses it. */
  const paramName = items.find((item) => item.param)?.param?.name;
  const current = paramName ? searchParams.get(paramName) : null;
  const known = items.some((item) => item.param?.value === current);

  return (
    <ul id={id} aria-labelledby={labelledBy} className={LIST}>
      {items.map((item) => {
        const active =
          onPath && (item.param ? item.param.value === current : !known);

        return (
          <li key={item.id}>
            <Link
              href={childHref(parentHref, item)}
              aria-current={active ? "page" : undefined}
              onClick={() => setMobileSidebarOpen(false)}
              className={cn(BASE, active ? ACTIVE : IDLE, active ? RAIL_CURRENT : RAIL)}
            >
              <span className="min-w-0 flex-1 truncate">{item.label}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
