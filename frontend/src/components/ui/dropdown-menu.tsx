"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import {
  DropdownMenuContext,
  MENU_ITEM_SELECTOR,
  useDropdownMenu,
} from "@/components/ui/dropdown-menu-context";
import { cn } from "@/lib/cn";

export {
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu-item";

export function DropdownMenu({ className, ...props }: React.ComponentProps<"div">) {
  const [open, setOpen] = useState(false);
  const contentId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const closeAndRefocus = useCallback(() => {
    setOpen(false);
    triggerRef.current?.focus();
  }, []);

  const value = useMemo(
    () => ({ open, setOpen, contentId, triggerRef, contentRef, closeAndRefocus }),
    [open, contentId, closeAndRefocus],
  );

  return (
    <DropdownMenuContext.Provider value={value}>
      <div className={cn("relative", className)} {...props} />
    </DropdownMenuContext.Provider>
  );
}

export function DropdownMenuTrigger({
  className,
  onClick,
  onKeyDown,
  ...props
}: React.ComponentProps<"button">) {
  const { open, setOpen, contentId, triggerRef } = useDropdownMenu();

  return (
    <button
      type="button"
      ref={triggerRef}
      aria-haspopup="menu"
      aria-expanded={open}
      aria-controls={open ? contentId : undefined}
      onClick={(event) => {
        onClick?.(event);
        setOpen(!open);
      }}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        if (event.key === "ArrowDown" || event.key === "ArrowUp") {
          event.preventDefault();
          setOpen(true);
        }
      }}
      className={className}
      {...props}
    />
  );
}

const ALIGN = { start: "left-0", end: "right-0" } as const;

export function DropdownMenuContent({
  align = "start",
  className,
  ...props
}: React.ComponentProps<"div"> & { align?: keyof typeof ALIGN }) {
  const { open, setOpen, contentId, contentRef, triggerRef, closeAndRefocus } =
    useDropdownMenu();

  /* Filtered to what is actually on screen: items can be hidden at a
     breakpoint (the shell links are `md:hidden`), and `.focus()` on a
     `display:none` element silently does nothing — leaving a dead stop in the
     arrow-key ring. `offsetParent` is null exactly when the element or an
     ancestor is not rendered. */
  const items = useCallback(
    () =>
      Array.from(
        contentRef.current?.querySelectorAll<HTMLElement>(MENU_ITEM_SELECTOR) ?? [],
      ).filter((item) => item.offsetParent !== null),
    [contentRef],
  );

  /* Opening moves focus into the menu — otherwise the arrow keys have nothing
     to move from and the trigger keeps announcing itself. */
  useEffect(() => {
    if (open) items()[0]?.focus();
  }, [open, items]);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      const target = event.target as Node;
      if (contentRef.current?.contains(target)) return;
      if (triggerRef.current?.contains(target)) return;
      setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open, setOpen, contentRef, triggerRef]);

  if (!open) return null;

  function onKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      closeAndRefocus();
      return;
    }
    /* Tabbing out closes the menu but lets focus travel on, as the menu
       pattern expects. */
    if (event.key === "Tab") {
      setOpen(false);
      return;
    }

    const list = items();
    if (list.length === 0) return;
    const from = list.indexOf(document.activeElement as HTMLElement);
    const next =
      event.key === "ArrowDown"
        ? (from + 1) % list.length
        : event.key === "ArrowUp"
          ? (from - 1 + list.length) % list.length
          : event.key === "Home"
            ? 0
            : event.key === "End"
              ? list.length - 1
              : -1;

    if (next < 0) return;
    event.preventDefault();
    list[next]?.focus();
  }

  return (
    <div
      id={contentId}
      ref={contentRef}
      role="menu"
      aria-orientation="vertical"
      onKeyDown={onKeyDown}
      className={cn(
        "absolute top-full z-50 mt-1 min-w-60 rounded-md border border-border bg-surface p-1 shadow-overlay",
        ALIGN[align],
        className,
      )}
      {...props}
    />
  );
}
