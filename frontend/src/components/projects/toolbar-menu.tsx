"use client";

import { useCallback, useRef, useState } from "react";
import { useMenuPopover } from "@/components/projects/use-menu-popover";
import { cn } from "@/lib/cn";

/**
 * The shell every toolbar popover shares: an icon trigger, and a panel in the
 * top layer beneath it.
 *
 * Its own component because Filter, Sort and Display are the same widget three
 * times over — the same 28px trigger, the same `showPopover()` panel, the same
 * outside-click and Escape (`use-menu-popover.ts` owns those and says why a
 * popover rather than a portal). What differs between them is only the icon
 * and the rows inside, so those are the props.
 *
 * `align="end"` IS THE ONE PIECE OF POSITIONING THIS ADDS. The hook places a
 * panel by its LEFT edge against the trigger's left, which is right for a menu
 * hanging off a control at the start of a row and wrong for these: the toolbar
 * is flush against the page's right margin, so a 224px panel opening rightwards
 * from a 28px button would sit half off the screen. Ending the panel where the
 * trigger ends keeps it on the page and reads as belonging to the button.
 *
 * `dot` is how a closed trigger says a filter is on. Colour alone would be the
 * only carrier of that, so the count also goes into the accessible name.
 *
 * `closeOnSelect` DISMISSES FROM THE PANEL, NOT FROM EACH ROW, and that shape
 * is deliberate. Handing a `close()` down to the rows would mean passing a
 * closure that reads `triggerRef` — created during render, which
 * `react-hooks/refs` rejects and is right to: it cannot tell a callback that
 * will be called on a click from one that is called immediately. One bubbled
 * handler on the panel needs no such closure, and it puts the rule in one
 * place instead of at every call site. It fires AFTER the row's own handler,
 * so a menu that navigates has already navigated by the time it closes.
 *
 * Filter and Sort pass it and the gear does not: those two navigate, so the
 * panel is over a changing list either way, where the gear's toggles have
 * their effect visible BEHIND the panel and being thrown out to try the other
 * option would be a second trip for one decision.
 */
export function ToolbarMenu({
  icon,
  label,
  panelLabel,
  height,
  width = 224,
  dot,
  closeOnSelect,
  children,
}: {
  icon: React.ReactNode;
  /** The trigger's accessible name — include any active state in words. */
  label: string;
  /** Names the panel itself, for a screen reader arriving inside it. */
  panelLabel: string;
  /** Passed rather than measured: the panel has no size before it is shown. */
  height: number;
  width?: number;
  /** Draws the "something is on" pip. */
  dot?: boolean;
  /** Dismiss after any row is chosen. See the note above. */
  closeOnSelect?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  /* `useCallback`, not an inline arrow, because this is handed to `children` as
     a render prop — a closure CREATED during render that reads a ref. It is
     only ever CALLED from a click, but the lint rule cannot see that through
     the prop, and it is right to be strict: a ref read during render would be
     a real bug in anything that did it eagerly. */
  const close = useCallback(() => {
    setOpen(false);
    triggerRef.current?.focus();
  }, []);

  const position = useMenuPopover({
    open,
    triggerRef,
    panelRef,
    height,
    width,
    align: "end",
    onDismiss: close,
  });

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={label}
        onClick={() => setOpen((value) => !value)}
        className={cn(
          "relative grid size-7 place-items-center rounded-sm text-text-muted transition-colors duration-100 ease-standard hover:bg-surface-hover hover:text-text",
          open && "bg-surface-hover text-text",
        )}
      >
        {icon}
        {dot && (
          <span
            aria-hidden="true"
            className="absolute top-0.5 right-0.5 size-1.5 rounded-full bg-brand-500 ring-2 ring-surface"
          />
        )}
      </button>

      {open && (
        <div
          ref={panelRef}
          popover="manual"
          role="menu"
          aria-label={panelLabel}
          /* The UA stylesheet gives popovers `position: fixed; inset: 0;
             margin: auto; border; padding; background` — stripped so the
             panel's own chrome is the only chrome. */
          className="menu-enter fixed inset-auto m-0 w-56 rounded-md border border-border bg-surface p-1 shadow-overlay"
          style={{ top: position.top, left: position.left }}
          /* Only a real row dismisses the panel — a click that lands on a
             section heading is not a choice. */
          onClick={(event) => {
            if (!closeOnSelect) return;
            if ((event.target as Element).closest('[role^="menuitem"]')) close();
          }}
        >
          {children}
        </div>
      )}
    </>
  );
}
