"use client";

import Link from "next/link";
import { Suspense, useId, useState } from "react";
import { SIDEBAR_ICON } from "@/components/layout/sidebar-icons";
import { SidebarSubNav } from "@/components/layout/sidebar-sub-nav";
import { ChevronDownIcon, MoreIcon, PlusIcon } from "@/components/ui/icons";
import { LockedControl } from "@/components/ui/locked-control";
import { cn } from "@/lib/cn";
import { setMobileSidebarOpen } from "@/lib/sidebar";
import type { SidebarItem as SidebarItemData } from "@/types/nav";

/*
 * A nav item that carries sub-views: a disclosure over the same `?view=` links
 * the page's view strip offers, plus the row actions the group would own.
 *
 * The row is a flex container, NOT a link with buttons inside it — a button
 * nested in an anchor is invalid, and the three controls here (toggle, link,
 * two locked actions) are four separate targets. The fill therefore sits on the
 * container and the link stays transparent, which is the only difference from
 * `SidebarItem`'s treatment.
 *
 * `aria-current` moves: while the group is open the current CHILD carries it,
 * so the row is styled active without claiming to be the page. Collapsed, the
 * row takes it back — it is then the only thing on screen naming the page.
 */
const ROW =
  "flex w-full items-center gap-1 rounded-sm pr-1 transition-colors duration-100 ease-standard";
const ROW_IDLE = "text-text-muted hover:bg-surface-sunken";
const ROW_ACTIVE = "bg-surface";
const LINK = "flex min-w-0 flex-1 items-center gap-2 py-1.5 text-left text-sm";
const ICON_BUTTON =
  "size-6 rounded-sm text-text-subtle hover:bg-surface-sunken hover:text-text";

/* Same row geometry as the real list — py-1 on 16px text is 24px — so the
   boundary resolving does not shift the nav under the cursor. */
function SubNavFallback({ count }: { count: number }) {
  return (
    <ul aria-hidden="true" className="mt-0.5 space-y-0.5">
      {Array.from({ length: count }, (_, index) => (
        <li key={index} className="h-6" />
      ))}
    </ul>
  );
}

export function SidebarTreeItem({
  item,
  href,
  active,
}: {
  item: SidebarItemData;
  /** Resolved by the caller; a group is only rendered when it has one. */
  href: string;
  active: boolean;
}) {
  const Icon = SIDEBAR_ICON[item.icon];
  const children = item.children ?? [];

  /* Open on arrival when this is the page being viewed, and a plain `useState`
     after that: the sidebar stays mounted across client navigations, so a group
     the user collapsed stays collapsed while they move around. */
  const [open, setOpen] = useState(active);

  /* Not derived from `item.id` — the desktop <aside> and the mobile drawer
     render this same tree at once, and a static id would appear twice. */
  const listId = useId();
  const labelId = useId();

  return (
    <li>
      <div className={cn(ROW, active ? ROW_ACTIVE : ROW_IDLE)}>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={open ? listId : undefined}
          aria-label={`${open ? "Collapse" : "Expand"} ${item.label}`}
          onClick={() => setOpen(!open)}
          className={cn("ml-1 inline-flex shrink-0", ICON_BUTTON)}
        >
          <ChevronDownIcon
            className={cn(
              "size-3.5 transition-transform duration-100 ease-standard",
              !open && "-rotate-90",
            )}
          />
        </button>

        <Link
          id={labelId}
          href={href}
          aria-current={active && !open ? "page" : undefined}
          /* Below `md` this row lives in the drawer, which has to close behind
             the navigation it just started. */
          onClick={() => setMobileSidebarOpen(false)}
          className={cn(LINK, active && "font-medium text-text")}
        >
          <Icon className="size-4 shrink-0" />
          <span className="min-w-0 flex-1 truncate">{item.label}</span>
        </Link>

        <LockedControl
          reason="Creating a project is not built yet"
          label={`New project in ${item.label}`}
          className={ICON_BUTTON}
        >
          <PlusIcon className="size-3.5" />
        </LockedControl>

        <LockedControl
          reason="These actions are not built yet"
          label={`${item.label} actions`}
          className={ICON_BUTTON}
        >
          <MoreIcon className="size-3.5" />
        </LockedControl>
      </div>

      {open && children.length > 0 ? (
        /* `SidebarSubNav` reads `useSearchParams`; the boundary is what stops
           that reading from opting the whole route out of prerendering. */
        <Suspense fallback={<SubNavFallback count={children.length} />}>
          <SidebarSubNav
            id={listId}
            labelledBy={labelId}
            parentHref={href}
            items={children}
            onPath={active}
          />
        </Suspense>
      ) : null}
    </li>
  );
}
