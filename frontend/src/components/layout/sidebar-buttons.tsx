"use client";

import { useSyncExternalStore } from "react";
import { CloseIcon, MenuIcon, PanelLeftIcon } from "@/components/ui/nav-icons";
import { cn } from "@/lib/cn";
import {
  getSidebarServerSnapshot,
  readSidebarCollapsed,
  setMobileSidebarOpen,
  setSidebarCollapsed,
  subscribeToSidebarCollapsed,
} from "@/lib/sidebar";

/*
 * The shell's four icon-only controls. One file because they are one mechanism
 * — the same two stores, the same 28px square — and splitting them would mean
 * four files of eight lines.
 *
 * `ICON_BUTTON` deliberately sets no `display`: every caller pairs a base
 * `hidden` with a breakpoint variant, and `cn` is a plain join, so a display in
 * the base would leave the stylesheet's order to pick the winner.
 */
const ICON_BUTTON =
  "size-7 shrink-0 items-center justify-center rounded-sm text-text-subtle transition-colors duration-100 ease-standard hover:bg-surface-sunken hover:text-text";

/** In the sidebar header, above `md`. Hides the sidebar entirely. */
export function SidebarCollapseButton() {
  return (
    <button
      type="button"
      aria-label="Collapse sidebar"
      onClick={() => setSidebarCollapsed(true)}
      className={cn("hidden md:inline-flex", ICON_BUTTON)}
    >
      <PanelLeftIcon className="size-4" />
    </button>
  );
}

/** In the content strip, above `md`. Only exists while the sidebar is hidden. */
export function SidebarExpandButton() {
  const collapsed = useSyncExternalStore(
    subscribeToSidebarCollapsed,
    readSidebarCollapsed,
    getSidebarServerSnapshot,
  );
  if (!collapsed) return null;

  return (
    <button
      type="button"
      aria-label="Show sidebar"
      onClick={() => setSidebarCollapsed(false)}
      className={cn("hidden md:inline-flex", ICON_BUTTON)}
    >
      <PanelLeftIcon className="size-4" />
    </button>
  );
}

/** The hamburger, below `md`. Opens the off-canvas drawer. */
export function MobileSidebarTrigger() {
  return (
    <button
      type="button"
      aria-label="Open navigation"
      onClick={() => setMobileSidebarOpen(true)}
      className={cn("inline-flex md:hidden", ICON_BUTTON)}
    >
      <MenuIcon className="size-4" />
    </button>
  );
}

/**
 * Sits in the sidebar header opposite the collapse button. The two never
 * appear together: this one is `md:hidden`, and below `md` the sidebar only
 * ever renders inside the drawer.
 */
export function MobileSidebarClose() {
  return (
    <button
      type="button"
      aria-label="Close navigation"
      onClick={() => setMobileSidebarOpen(false)}
      className={cn("inline-flex md:hidden", ICON_BUTTON)}
    >
      <CloseIcon className="size-4" />
    </button>
  );
}
