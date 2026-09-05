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
 */
const BASE =
  "flex w-full items-center gap-2 rounded-sm py-1 pr-2 pl-8 text-left text-xs transition-colors duration-100 ease-standard";
const IDLE = "text-text-muted hover:bg-surface-sunken hover:text-text";
const ACTIVE = "bg-surface font-medium text-text";

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
    <ul id={id} aria-labelledby={labelledBy} className="mt-0.5 space-y-0.5">
      {items.map((item) => {
        const active =
          onPath && (item.param ? item.param.value === current : !known);

        return (
          <li key={item.id}>
            <Link
              href={childHref(parentHref, item)}
              aria-current={active ? "page" : undefined}
              onClick={() => setMobileSidebarOpen(false)}
              className={cn(BASE, active ? ACTIVE : IDLE)}
            >
              <span
                aria-hidden="true"
                className="size-1 shrink-0 rounded-full bg-current opacity-70"
              />
              <span className="min-w-0 flex-1 truncate">{item.label}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
