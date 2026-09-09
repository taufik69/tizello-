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
 * once at 0,0 first — a visible jump. `width` is the same measurement and
 * defaults to the 272px every menu here uses; a panel that is narrower must
 * say so, or it is clamped as though it were 272 wide and drifts left of its
 * trigger near the viewport's right edge — which is exactly where a drawer is.
 */
const MARGIN = 8;
const DEFAULT_WIDTH = 272;

export function useMenuPopover({
  open,
  triggerRef,
  panelRef,
  height,
  width = DEFAULT_WIDTH,
  onDismiss,
}: {
  open: boolean;
  triggerRef: RefObject<HTMLElement | null>;
  panelRef: RefObject<HTMLElement | null>;
  height: number;
  /** Defaults to 272 — the width every menu panel in these drawers is. */
  width?: number;
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

      const top = Math.max(
        MARGIN,
        Math.min(flip ? rect.top - height - 4 : below, window.innerHeight - height - MARGIN),
      );
      const left = Math.max(MARGIN, Math.min(rect.left, window.innerWidth - width - MARGIN));

      /* THE SAME POSITION MUST BE THE SAME OBJECT, or this effect is a render
         loop: every caller passes an inline `onDismiss`, so a new identity on
         each render re-runs the effect, and a fresh `{ top, left }` — equal in
         value, unequal to `Object.is` — would schedule the render that re-runs
         it again. Returning `current` lets React bail out instead. */
      setPosition((current) =>
        current.top === top && current.left === left ? current : { top, left },
      );

      /* `showPopover()` throws `InvalidStateError` on a popover that is ALREADY
         showing, and the re-runs above reach here a second time. Cheap to ask,
         and the alternative is a thrown error on the render after every open. */
      if (!panel.matches(":popover-open")) panel.showPopover();
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
  }, [open, triggerRef, panelRef, height, width, onDismiss]);

  return position;
}
