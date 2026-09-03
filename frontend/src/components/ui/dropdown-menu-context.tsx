"use client";

import { createContext, useContext } from "react";

/*
 * Split out so `dropdown-menu-item.tsx` can read the context without importing
 * `dropdown-menu.tsx`, which re-exports it — a cycle otherwise.
 */
export type DropdownMenuContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
  contentId: string;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
  contentRef: React.RefObject<HTMLDivElement | null>;
  /** Closes and hands focus back to the trigger — where the user left it. */
  closeAndRefocus: () => void;
};

export const DropdownMenuContext =
  createContext<DropdownMenuContextValue | null>(null);

export function useDropdownMenu(): DropdownMenuContextValue {
  const context = useContext(DropdownMenuContext);
  if (!context) {
    throw new Error("DropdownMenu parts must be rendered inside <DropdownMenu>");
  }
  return context;
}

/** Disabled items are skipped by the arrow keys, per the menu pattern. */
export const MENU_ITEM_SELECTOR = '[role="menuitem"]:not([aria-disabled="true"])';
