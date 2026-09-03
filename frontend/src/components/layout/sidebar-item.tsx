"use client";

import Link from "next/link";
import { SIDEBAR_ICON } from "@/components/layout/sidebar-icons";
import { cn } from "@/lib/cn";
import { setMobileSidebarOpen } from "@/lib/sidebar";
import type { SidebarItem as SidebarItemData } from "@/types/nav";

/*
 * The sidebar sits on `bg-canvas`, where `surface-hover` is invisible in light
 * (both resolve to ink-100). So the two fills step outward from the canvas
 * instead, and both directions work in either theme:
 *
 *   hover  → surface-sunken   (darker in light, lighter in dark)
 *   active → surface          (further again — the whole active treatment,
 *                              plus brighter text; no accent bar)
 */
const BASE =
  "flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm transition-colors duration-100 ease-standard";
const IDLE = "text-text-muted hover:bg-surface-sunken hover:text-text";
const ACTIVE = "bg-surface font-medium text-text";
const DISABLED = "cursor-not-allowed text-text-subtle opacity-60";

export function SidebarItem({
  item,
  href,
  active,
}: {
  item: SidebarItemData;
  /** Resolved by the caller. Absent renders the item disabled. */
  href?: string;
  active: boolean;
}) {
  const Icon = SIDEBAR_ICON[item.icon];

  if (!href) {
    return (
      <li>
        {/* A real disabled control, not a dimmed link: not focusable, not
            navigable, and announced as unavailable. */}
        <button
          type="button"
          disabled
          aria-disabled="true"
          title={item.hint}
          className={cn(BASE, DISABLED)}
        >
          <Icon className="size-4 shrink-0" />
          <span className="min-w-0 flex-1 truncate">{item.label}</span>
          <span className="shrink-0 rounded-xs border border-border px-1 text-2xs">
            Soon
          </span>
        </button>
      </li>
    );
  }

  return (
    <li>
      <Link
        href={href}
        aria-current={active ? "page" : undefined}
        /* Below `md` this item lives inside the drawer, which has to close
           behind the navigation it just started. */
        onClick={() => setMobileSidebarOpen(false)}
        className={cn(BASE, active ? ACTIVE : IDLE)}
      >
        <Icon className="size-4 shrink-0" />
        <span className="min-w-0 flex-1 truncate">{item.label}</span>
      </Link>
    </li>
  );
}
