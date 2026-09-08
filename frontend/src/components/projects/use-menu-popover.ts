"use client";

import { useEffect, useState, type RefObject } from "react";

/**
 * Places a top-layer menu popover against its trigger, calls `showPopover()`,
 * and wires outside-click and Escape.
 *
 * `showPopover()` rather than a portal: these menus open inside
 * `ui/drawer.tsx`'s `<dialog>`, where a `createPortal` to `document.body`
 * renders BEHIND the modal backdrop and a `position: fixed` descendant is
 * clipped by the drawer's own `overflow-y: auto`. The top layer has neither
 * problem. `EmojiPickerPopover` documents the finding at length.
 *
 * Escape is handled in the CAPTURE phase and stopped: it means "close this
 * menu", the innermost thing open, and without stopping it the drawer's own
 * handler closes the whole panel out from under the user.
 *
 * `height` is passed rather than measured because the panel has no intrinsic
 * size before it is shown, and measuring after `showPopover()` would place it
 * once at 0,0 first — a visible jump.
 */
const MARGIN = 8;
const PANEL_WIDTH = 272;

export function useMenuPopover({
  open,
  triggerRef,
  panelRef,
  height,
  onDismiss,
}: {
  open: boolean;
  triggerRef: RefObject<HTMLElement | null>;
  panelRef: RefObject<HTMLElement | null>;
  height: number;
  onDismiss: () => void;
}) {
  const [position, setPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (!open) return;

    const trigger = triggerRef.current;
    const panel = panelRef.current;

    if (trigger && panel) {
      const rect = trigger.getBoundingClientRect();
      const below = rect.bottom + 4;
      /* Flip above the trigger when there is no room below — "+ Add a
         property" sits at the BOTTOM of a long list, so that is the common
         case here rather than the edge one. */
      const flip = below + height > window.innerHeight && rect.top - height - 4 >= MARGIN;

      setPosition({
        top: Math.max(
          MARGIN,
          Math.min(flip ? rect.top - height - 4 : below, window.innerHeight - height - MARGIN),
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
      if (panelRef.current?.contains(target) || triggerRef.current?.contains(target)) return;
      onDismiss();
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      event.stopPropagation();
      onDismiss();
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown, true);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown, true);
    };
  }, [open, triggerRef, panelRef, height, onDismiss]);

  return position;
}
