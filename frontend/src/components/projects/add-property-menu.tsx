"use client";

import { useEffect, useRef, useState } from "react";
import { PlusIcon } from "@/components/ui/icons";
import { PropertyIcon } from "@/components/projects/property-icons";
import {
  OPTIONAL_PROPERTIES,
  PROPERTY_META,
  type OptionalProperty,
} from "@/components/projects/project-properties";

/**
 * "+ Add a property", and the list it opens.
 *
 * A **popover** (`showPopover()`), not an absolutely-positioned div: this sits
 * inside `ui/drawer.tsx`'s `<dialog>`, where a `position: fixed` descendant is
 * clipped by the drawer's own `overflow-y: auto` and a portal to `document.body`
 * renders behind the modal backdrop. The top layer has neither problem —
 * `EmojiPickerPopover` documents the finding at length.
 *
 * Properties already on the form are omitted rather than disabled. A disabled
 * row invites a click that does nothing; the list is short enough that its
 * shrinking IS the feedback, and the trigger disappears entirely once every
 * property is on.
 */
const PANEL_WIDTH = 268;
const MARGIN = 8;

export function AddPropertyMenu({
  shown,
  onAdd,
}: {
  shown: OptionalProperty[];
  onAdd: (property: OptionalProperty) => void;
}) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const available = OPTIONAL_PROPERTIES.filter((property) => !shown.includes(property));

  useEffect(() => {
    if (!open) return;

    const trigger = triggerRef.current;
    const panel = panelRef.current;

    if (trigger && panel) {
      const rect = trigger.getBoundingClientRect();
      const height = panel.offsetHeight || 200;
      const below = rect.bottom + 4;

      setPosition({
        top: Math.max(
          MARGIN,
          Math.min(
            below + height > window.innerHeight ? rect.top - height - 4 : below,
            window.innerHeight - height - MARGIN,
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
      setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        /* Stops the drawer's own Esc handler from closing the whole panel —
           Escape here means "close this list", which is the innermost thing
           that is open. */
        event.stopPropagation();
        setOpen(false);
        triggerRef.current?.focus();
      }
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown, true);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown, true);
    };
  }, [open]);

  /* Nothing left to add: the trigger goes rather than sitting there disabled. */
  if (available.length === 0) return null;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="mt-1 flex w-full items-center gap-1.5 rounded-sm px-2 py-1.5 text-xs text-text-subtle transition-colors duration-100 ease-standard hover:bg-surface-hover hover:text-text"
      >
        <PlusIcon className="size-3.5" />
        Add a property
      </button>

      {open && (
        <div
          ref={panelRef}
          popover="manual"
          role="menu"
          aria-label="Add a property"
          /* The UA stylesheet gives popovers `position: fixed; inset: 0;
             margin: auto; border; padding; background` — stripped here so the
             panel's own chrome is the only chrome. */
          className="fixed inset-auto m-0 rounded-md border border-border bg-surface p-1 shadow-overlay"
          style={{ top: position.top, left: position.left, width: PANEL_WIDTH }}
        >
          <p className="px-2 py-1 text-2xs font-medium tracking-wide text-text-subtle uppercase">
            Properties
          </p>

          {available.map((property) => {
            const meta = PROPERTY_META[property];
            return (
              <button
                key={property}
                type="button"
                role="menuitem"
                onClick={() => {
                  onAdd(property);
                  setOpen(false);
                }}
                className="flex w-full items-start gap-2 rounded-sm px-2 py-1.5 text-left transition-colors duration-100 ease-standard hover:bg-surface-hover"
              >
                <PropertyIcon kind={meta.icon} />
                <span className="min-w-0">
                  <span className="block text-xs font-medium text-text">{meta.label}</span>
                  <span className="block text-2xs text-text-subtle">{meta.hint}</span>
                </span>
              </button>
            );
          })}
        </div>
      )}
    </>
  );
}
