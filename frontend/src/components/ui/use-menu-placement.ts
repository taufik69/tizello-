"use client";

import { useLayoutEffect, useState, type RefObject } from "react";

/**
 * Fixed-viewport coordinates for a menu anchored to a trigger, recomputed on
 * scroll and resize.
 *
 * It exists as a hook, separate from `dropdown-menu.tsx`, for the same reason
 * the menu is portalled at all: the positioning is generic, and the menu file
 * is already at the 150-line cap without it.
 *
 * `visible` is false until the first measurement lands. The menu has to be in
 * the DOM to be measured, and painting it at 0,0 for one frame first is a
 * visible jump.
 */

/** Gap between the trigger and the menu, in px. */
const GAP = 4;
/** Keeps a menu off the very edge of the viewport when the clamp below bites. */
const EDGE = 8;

export type MenuAlign = "start" | "end";
export type MenuPlacement = { top: number; left: number; visible: boolean };

export function useMenuPlacement({
  open,
  align,
  triggerRef,
  contentRef,
}: {
  open: boolean;
  align: MenuAlign;
  triggerRef: RefObject<HTMLElement | null>;
  contentRef: RefObject<HTMLElement | null>;
}): MenuPlacement {
  const [placement, setPlacement] = useState<MenuPlacement>({
    top: 0,
    left: 0,
    visible: false,
  });

  /* Layout effect, not effect: this runs after the commit that mounts the menu
     but before paint, so the measured position is the first one drawn — and a
     stale placement carried over from the previous open is never painted. */
  useLayoutEffect(() => {
    if (!open) return;

    function place() {
      const trigger = triggerRef.current;
      const content = contentRef.current;
      if (!trigger || !content) return;

      const anchor = trigger.getBoundingClientRect();
      const { offsetWidth: width, offsetHeight: height } = content;

      const below = anchor.bottom + GAP;
      const above = anchor.top - GAP - height;
      /* Flip up only when there is room up there — a menu taller than the
         viewport must not be pushed off the top to escape the bottom. */
      const top = below + height > window.innerHeight && above >= EDGE ? above : below;

      const preferred = align === "end" ? anchor.right - width : anchor.left;
      const left = Math.max(EDGE, Math.min(preferred, window.innerWidth - width - EDGE));

      setPlacement({ top, left, visible: true });
    }

    place();
    /* Capture phase: a scroll inside an overflow container — `table.tsx`'s, for
       one — does not bubble to window, and that container is exactly the case
       the portal exists to survive. */
    window.addEventListener("scroll", place, true);
    window.addEventListener("resize", place);
    return () => {
      window.removeEventListener("scroll", place, true);
      window.removeEventListener("resize", place);
    };
  }, [open, align, triggerRef, contentRef]);

  return placement;
}
