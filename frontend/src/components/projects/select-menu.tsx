"use client";

import { useEffect, useRef, useState } from "react";
import { useMenuPopover } from "@/components/projects/use-menu-popover";
import { CheckIcon, ChevronDownIcon } from "@/components/ui/icons";
import { cn } from "@/lib/cn";

/**
 * The drawer's dropdown — a listbox popover, not a native `<select>`.
 *
 * Status and Priority were plain `<select>`s, chosen because "the native
 * control is keyboard-complete, works on touch, and these are six and four
 * fixed options with no search, no icons and no multi-select to justify
 * rebuilding it". Two of those three premises held; the icons one did not.
 * Every OTHER surface in this app draws a status as a coloured dot and a
 * priority as a tinted chip (`project-tone.ts`), and a native option list can
 * carry neither — so the one place you CHOOSE a status was the one place it
 * had no colour, and the drawer read as a form where the rest of the app reads
 * as a board.
 *
 * It also could not be styled: a UA option list ignores the theme, so in dark
 * mode the open menu was a white sheet in the middle of a dark drawer.
 *
 * What is rebuilt is only what a native select gave for free, and each piece
 * is here rather than assumed:
 *
 * - **Top layer, via `showPopover()`.** This opens inside `ui/drawer.tsx`'s
 *   `<dialog>`, where a fixed descendant is clipped by the drawer's own
 *   `overflow-y: auto` and a portal renders behind the modal backdrop.
 *   `useMenuPopover` documents the finding; it also handles outside-click and
 *   an Escape that does not close the whole drawer.
 * - **Roving focus.** Opening focuses the CHOSEN option, arrows move, Home and
 *   End jump — which is what makes the list navigable without a pointer.
 * - **`role="listbox"` / `role="option"` with `aria-selected`,** so it is
 *   announced as a choice rather than as eight buttons.
 */
export type SelectOption<T extends string> = {
  value: T;
  label: string;
  /** The dot or chip that carries the meaning at a glance. Decorative — the label sits beside it. */
  adornment?: React.ReactNode;
};

const PANEL_HEIGHT = 264;

export function SelectMenu<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  /** Names the control for a screen reader — the visible label lives in the property row's left column. */
  label: string;
  value: T;
  options: readonly SelectOption<T>[];
  onChange: (value: T) => void;
}) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const position = useMenuPopover({
    open,
    triggerRef,
    panelRef,
    height: PANEL_HEIGHT,
    onDismiss: () => {
      setOpen(false);
      triggerRef.current?.focus();
    },
  });

  /* Focus lands on the chosen option, not the first one — arrowing from where
     you are is the behaviour a native select has and the reason this is worth
     writing out. */
  useEffect(() => {
    if (!open) return;
    const panel = panelRef.current;
    panel?.querySelector<HTMLButtonElement>('[aria-selected="true"]')?.focus();
  }, [open]);

  const current = options.find((option) => option.value === value);

  function move(from: HTMLElement, step: number | "first" | "last") {
    const items = [...(panelRef.current?.querySelectorAll<HTMLButtonElement>('[role="option"]') ?? [])];
    const index = items.indexOf(from as HTMLButtonElement);
    const next =
      step === "first" ? 0
      : step === "last" ? items.length - 1
      : (index + step + items.length) % items.length;
    items[next]?.focus();
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    const keys = { ArrowDown: 1, ArrowUp: -1 } as const;
    const target = event.target as HTMLElement;

    if (event.key in keys) {
      event.preventDefault();
      move(target, keys[event.key as keyof typeof keys]);
    } else if (event.key === "Home" || event.key === "End") {
      event.preventDefault();
      move(target, event.key === "Home" ? "first" : "last");
    }
  }

  function choose(next: T) {
    onChange(next);
    setOpen(false);
    triggerRef.current?.focus();
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={label}
        onClick={() => setOpen((current) => !current)}
        className="flex h-9 w-full items-center gap-2 rounded-sm border border-transparent px-2.5 text-left text-sm text-text transition-colors duration-100 ease-standard hover:bg-surface-hover"
      >
        {current?.adornment}
        <span className="min-w-0 flex-1 truncate">{current?.label ?? "Empty"}</span>
        <ChevronDownIcon className="size-3.5 shrink-0 text-text-subtle" />
      </button>

      {open && (
        <div
          ref={panelRef}
          popover="manual"
          role="listbox"
          aria-label={label}
          onKeyDown={onKeyDown}
          /* The UA stylesheet gives popovers `position: fixed; inset: 0;
             margin: auto; border; padding; background` — stripped so the
             panel's own chrome is the only chrome. */
          className="fixed inset-auto m-0 max-h-64 w-56 overflow-y-auto rounded-md border border-border bg-surface p-1 shadow-overlay"
          style={{ top: position.top, left: position.left }}
        >
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              role="option"
              aria-selected={option.value === value}
              onClick={() => choose(option.value)}
              className={cn(
                "flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm transition-colors duration-100 ease-standard hover:bg-surface-hover",
                option.value === value ? "text-text" : "text-text-muted",
              )}
            >
              {option.adornment}
              <span className="min-w-0 flex-1 truncate">{option.label}</span>
              {option.value === value && (
                <CheckIcon className="size-3.5 shrink-0 text-text-brand" />
              )}
            </button>
          ))}
        </div>
      )}
    </>
  );
}
