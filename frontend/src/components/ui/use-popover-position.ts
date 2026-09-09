"use client";

import { useEffect, useState, type RefObject } from "react";

/**
 * Places a top-layer popover panel against its trigger, and calls
 * `showPopover()` once it is measured.
 *
 * Extracted from `DateField` so that file stays under the 150-line cap and so
 * the next popover — a person picker, a filter menu — does not re-derive the
 * flip-and-clamp logic.
 *
 * `showPopover()` rather than a portal: these panels open inside
 * `ui/dialog.tsx`'s `<dialog>`, where a `createPortal` to `document.body`
 * renders BEHIND the modal backdrop and a `position: fixed` descendant is
 * clipped by the dialog's own `overflow-y: auto`. The top layer has neither
 * problem. `EmojiPickerPopover` documents the finding at length.
 *
 * The dimensions are constants rather than measurements because the panel has
 * no intrinsic size before it is shown, and measuring it after `showPopover()`
 * would place it once at 0,0 first — a visible jump.
 */
export const PANEL_WIDTH = 268;
const PANEL_HEIGHT = 340;
const MARGIN = 8;

export function usePopoverPosition({
  open,
  triggerRef,
  panelRef,
  onDismiss,
}: {
  open: boolean;
  triggerRef: RefObject<HTMLElement | null>;
  panelRef: RefObject<HTMLElement | null>;
  /** Outside click or Escape. The caller owns `open`, so closing is its call to make. */
  onDismiss: () => void;
}) {
  const [position, setPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (!open) return;

    const trigger = triggerRef.current;
    const panel = panelRef.current;

    if (trigger && panel) {
      const rect = trigger.getBoundingClientRect();
      /* Flip above the trigger when there is no room below — a date field near
         the bottom of a long dialog is the common case, not the edge one. Only
         when there is actually room up there: a panel taller than the viewport
         must not be pushed off the top to escape the bottom. */
      const below = rect.bottom + 4;
      const flip =
        below + PANEL_HEIGHT > window.innerHeight &&
        rect.top - PANEL_HEIGHT - 4 >= MARGIN;

      setPosition({
        top: Math.max(
          MARGIN,
          Math.min(
            flip ? rect.top - PANEL_HEIGHT - 4 : below,
            window.innerHeight - PANEL_HEIGHT - MARGIN,
          ),
        ),
        left: Math.max(
          MARGIN,
          Math.min(rect.left, window.innerWidth - PANEL_WIDTH - MARGIN),
        ),
      });

      panel.showPopover();
    }

    function onPointerDown(event: PointerEvent) {
      const target = event.target as Node;
      if (panelRef.current?.contains(target) || triggerRef.current?.contains(target)) {
        return;
      }
      onDismiss();
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onDismiss();
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, triggerRef, panelRef, onDismiss]);

  return position;
}
