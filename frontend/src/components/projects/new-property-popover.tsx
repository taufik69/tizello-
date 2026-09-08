"use client";

import { useEffect, useRef, useState } from "react";
import { PropertyTypeIcon } from "@/components/projects/property-type-icons";
import { TextField } from "@/components/ui/text-field";
import {
  PROPERTY_TYPES,
  PROPERTY_TYPE_HINT,
  PROPERTY_TYPE_LABEL,
  type PropertyType,
} from "@/types/project-property";

/**
 * Notion's property-type menu: a name field, then the type list.
 *
 * A **popover** (`showPopover()`), not an absolutely-positioned div: this opens
 * inside `ui/drawer.tsx`'s `<dialog>`, where a `position: fixed` descendant is
 * clipped by the drawer's `overflow-y: auto` and a portal to `document.body`
 * renders behind the modal backdrop. The top layer has neither problem —
 * `EmojiPickerPopover` documents the finding at length.
 *
 * Picking a type SUBMITS: there is no second confirm step, because the name is
 * already typed and the type is the last decision. Notion behaves the same way,
 * and a Create button below a 9-row list would be below the fold.
 *
 * The name is optional here and defaulted to the type's own label — "Text",
 * "Date" — so a fast click still produces a usable column. The API's
 * uniqueness constraint then makes a second unnamed Date a `409`, which is
 * exactly when a name was worth typing.
 */
const PANEL_WIDTH = 268;
const MARGIN = 8;

export function NewPropertyPopover({
  open,
  triggerRef,
  pending,
  error,
  onCreate,
  onDismiss,
}: {
  open: boolean;
  triggerRef: React.RefObject<HTMLElement | null>;
  pending: boolean;
  error?: string;
  onCreate: (input: { name: string; type: PropertyType }) => void;
  onDismiss: () => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [name, setName] = useState("");
  const [position, setPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (!open) return;

    const trigger = triggerRef.current;
    const panel = panelRef.current;

    if (trigger && panel) {
      const rect = trigger.getBoundingClientRect();
      const height = panel.offsetHeight || 420;
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
      onDismiss();
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      /* Stops the drawer's own Esc handler from closing the whole panel —
         Escape here means "close this menu", the innermost thing that is
         open. Capture phase, so it runs before the dialog sees it. */
      event.stopPropagation();
      onDismiss();
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown, true);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown, true);
    };
  }, [open, triggerRef, onDismiss]);

  if (!open) return null;

  return (
    <div
      ref={panelRef}
      popover="manual"
      role="dialog"
      aria-label="New property"
      /* The UA stylesheet gives popovers `position: fixed; inset: 0; margin:
         auto; border; padding; background` — stripped so the panel's own
         chrome is the only chrome. */
      className="fixed inset-auto m-0 flex max-h-[26rem] flex-col rounded-md border border-border bg-surface p-1 shadow-overlay"
      style={{ top: position.top, left: position.left, width: PANEL_WIDTH }}
    >
      <div className="p-1">
        <TextField
          label="Property name"
          name="propertyName"
          autoComplete="off"
          autoFocus
          required={false}
          placeholder="Property name"
          error={error}
          onValueChange={setName}
        />
      </div>

      <p className="px-2 pt-2 pb-1 text-2xs font-medium tracking-wide text-text-subtle uppercase">
        Type
      </p>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {PROPERTY_TYPES.map((type) => (
          <button
            key={type}
            type="button"
            disabled={pending}
            onClick={() => onCreate({ name: name.trim() || PROPERTY_TYPE_LABEL[type], type })}
            className="flex w-full items-start gap-2 rounded-sm px-2 py-1.5 text-left transition-colors duration-100 ease-standard hover:bg-surface-hover disabled:opacity-50"
          >
            <PropertyTypeIcon type={type} className="mt-0.5 size-3.5 shrink-0 text-text-subtle" />
            <span className="min-w-0">
              <span className="block text-xs font-medium text-text">
                {PROPERTY_TYPE_LABEL[type]}
              </span>
              <span className="block text-2xs text-text-subtle">
                {PROPERTY_TYPE_HINT[type]}
              </span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
