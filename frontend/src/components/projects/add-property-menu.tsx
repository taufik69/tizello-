"use client";

import { useRef, useState } from "react";
import { PropertyIcon } from "@/components/projects/property-icons";
import { PropertyTypeIcon } from "@/components/projects/property-type-icons";
import {
  OPTIONAL_PROPERTIES,
  PROPERTY_META,
  type OptionalProperty,
} from "@/components/projects/project-properties";
import { MenuItem, MenuLabel } from "@/components/projects/menu-primitives";
import { useMenuPopover } from "@/components/projects/use-menu-popover";
import { PlusIcon } from "@/components/ui/icons";
import { TextField } from "@/components/ui/text-field";
import {
  PROPERTY_TYPES,
  PROPERTY_TYPE_HINT,
  PROPERTY_TYPE_LABEL,
  type PropertyType,
} from "@/types/project-property";

/**
 * ONE "+ Add a property", offering both kinds.
 *
 * There used to be two triggers stacked on top of each other — one for the
 * project's own optional fields, one for custom columns — which asked the user
 * to know a distinction that only exists in the database. Notion has one menu;
 * so does this. The two sections inside it are the honest version of the
 * difference:
 *
 * - **Project fields** already exist on every project (`description`, the
 *   dates, the glyph). Adding one reveals its row; it is not a schema change,
 *   so anyone who can edit the project can do it.
 * - **New property** creates a workspace column with a type. It changes every
 *   project in the workspace, so it is admin-only and the section is simply
 *   absent for everyone else rather than shown disabled.
 *
 * A **popover** (`showPopover()`), not an absolutely-positioned div: this opens
 * inside `ui/drawer.tsx`'s `<dialog>`, where a `position: fixed` descendant is
 * clipped by the drawer's `overflow-y: auto` and a portal to `document.body`
 * renders behind the modal backdrop. The top layer has neither problem —
 * `EmojiPickerPopover` documents the finding at length.
 */
const PANEL_WIDTH = 272;
const PANEL_HEIGHT = 448;

export function AddPropertyMenu({
  shown,
  canManage,
  pending,
  error,
  onAddField,
  onCreateProperty,
}: {
  shown: OptionalProperty[];
  canManage: boolean;
  pending: boolean;
  error?: string;
  onAddField: (property: OptionalProperty) => void;
  onCreateProperty: (input: { name: string; type: PropertyType }) => void;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const fields = OPTIONAL_PROPERTIES.filter((property) => !shown.includes(property));

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

  /* Nothing left to offer at all: the trigger goes rather than sitting there
     opening an empty menu. */
  if (fields.length === 0 && !canManage) return null;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="mt-1 flex items-center gap-1.5 rounded-sm px-2 py-1.5 text-xs text-text-subtle transition-colors duration-100 ease-standard hover:bg-surface-hover hover:text-text"
      >
        <PlusIcon className="size-3.5" />
        Add a property
      </button>

      {open && (
        <div
          ref={panelRef}
          popover="manual"
          role="dialog"
          aria-label="Add a property"
          /* The UA stylesheet gives popovers `position: fixed; inset: 0;
             margin: auto; border; padding; background` — stripped so the
             panel's own chrome is the only chrome. */
          className="fixed inset-auto m-0 flex max-h-[28rem] flex-col rounded-md border border-border bg-surface p-1 shadow-overlay"
          style={{ top: position.top, left: position.left, width: PANEL_WIDTH }}
        >
          <div className="min-h-0 flex-1 overflow-y-auto">
            {fields.length > 0 && (
              <>
                <MenuLabel>Project fields</MenuLabel>
                {fields.map((property) => {
                  const meta = PROPERTY_META[property];
                  return (
                    <MenuItem
                      key={property}
                      icon={<PropertyIcon kind={meta.icon} />}
                      label={meta.label}
                      hint={meta.hint}
                      onClick={() => {
                        onAddField(property);
                        setOpen(false);
                      }}
                    />
                  );
                })}
              </>
            )}

            {canManage && (
              <>
                <MenuLabel>New property</MenuLabel>
                <div className="px-1 pb-1">
                  <TextField
                    label="Property name"
                    name="propertyName"
                    autoComplete="off"
                    required={false}
                    placeholder="Property name"
                    error={error}
                    onValueChange={setName}
                  />
                </div>
                {PROPERTY_TYPES.map((type) => (
                  <MenuItem
                    key={type}
                    icon={<PropertyTypeIcon type={type} />}
                    label={PROPERTY_TYPE_LABEL[type]}
                    hint={PROPERTY_TYPE_HINT[type]}
                    disabled={pending}
                    /* Picking a type SUBMITS — the name is already typed and
                       the type is the last decision, so a Create button below
                       a nine-row list would only ever be below the fold.
                       Notion behaves the same way. An empty name falls back to
                       the type's own label, so a fast click still produces a
                       usable column. */
                    onClick={() =>
                      onCreateProperty({
                        name: name.trim() || PROPERTY_TYPE_LABEL[type],
                        type,
                      })
                    }
                  />
                ))}
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
