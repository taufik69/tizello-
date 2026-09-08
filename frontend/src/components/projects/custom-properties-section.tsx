"use client";

import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { CustomPropertyRow } from "@/components/projects/custom-property-row";
import { NewPropertyPopover } from "@/components/projects/new-property-popover";
import { PlusIcon } from "@/components/ui/icons";
import {
  createPropertyDefAction,
  deletePropertyDefAction,
} from "@/lib/actions/project-property-actions";
import { emptyValueFor } from "@/types/project-property";
import type {
  ProjectPropertyDef,
  ProjectPropertyPatch,
  PropertyType,
  PropertyValue,
} from "@/types/project-property";
import { PROJECT_ERROR_COPY } from "@/types/project";

/**
 * The custom-property block of the project drawer: every definition in the
 * workspace as a row, plus "+ Add a property".
 *
 * DEFINITIONS AND VALUES ARE SAVED AT DIFFERENT TIMES, and that is not an
 * inconsistency — it is what the two things are.
 *
 * - Creating or deleting a DEFINITION writes immediately, because it changes
 *   the workspace's schema and every other project in it. Holding that behind
 *   this project's Save would mean a column appearing for everyone only when
 *   one person finished editing one project — and vanishing if they cancelled.
 * - A VALUE rides the project's own Save, with the rest of the form.
 *
 * The local `defs` list is seeded from the server and then updated in place, so
 * a property added here appears without a round trip through the router. The
 * write has already landed by then; this is reconciliation, not optimism.
 */
export function CustomPropertiesSection({
  workspaceId,
  definitions,
  values,
  today,
  canManage,
  onChange,
}: {
  workspaceId: string;
  definitions: ProjectPropertyDef[];
  /** The project's stored values, keyed by definition id. */
  values: ProjectPropertyPatch;
  today: string;
  /** Workspace OWNER/ADMIN. Decides whether the schema controls are drawn — the API enforces it. */
  canManage: boolean;
  onChange: (patch: ProjectPropertyPatch) => void;
}) {
  const [defs, setDefs] = useState(definitions);
  const [picking, setPicking] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [isPending, startTransition] = useTransition();
  const triggerRef = useRef<HTMLButtonElement>(null);

  function create(input: { name: string; type: PropertyType }) {
    startTransition(async () => {
      const result = await createPropertyDefAction(workspaceId, input);

      if (result.code === "CONFLICT") {
        setError("A property with that name already exists.");
        return;
      }
      if (result.code) {
        setError(PROJECT_ERROR_COPY[result.code] ?? PROJECT_ERROR_COPY.SERVER_ERROR);
        return;
      }

      setDefs((current) => [...current, result.property!]);
      /* Seeded to the type's empty value rather than left undefined, so the new
         row renders a usable control instead of an uncontrolled one that warns
         the moment it is typed into. */
      onChange({ [result.property!.id]: emptyValueFor(input.type) });
      setError(undefined);
      setPicking(false);
    });
  }

  function remove(definition: ProjectPropertyDef) {
    startTransition(async () => {
      const result = await deletePropertyDefAction(workspaceId, definition.id);

      if (result.code) {
        toast.error(PROJECT_ERROR_COPY[result.code] ?? PROJECT_ERROR_COPY.SERVER_ERROR);
        return;
      }

      setDefs((current) => current.filter((entry) => entry.id !== definition.id));
      toast.success(`${definition.name} removed from this workspace.`);
    });
  }

  return (
    <section className="mt-5 border-t border-border pt-3">
      <h3 className="px-2 text-2xs font-medium tracking-wide text-text-subtle uppercase">
        Properties
      </h3>

      <div className="mt-1">
        {defs.map((definition) => (
          <CustomPropertyRow
            key={definition.id}
            definition={definition}
            value={(values[definition.id] ?? undefined) as PropertyValue | undefined}
            today={today}
            canManage={canManage}
            onChange={(value) => onChange({ [definition.id]: value })}
            onDeleteDefinition={() => remove(definition)}
          />
        ))}

        {defs.length === 0 && (
          <p className="px-2 py-1.5 text-xs text-text-subtle">
            No custom properties yet.
          </p>
        )}
      </div>

      {canManage ? (
        <>
          <button
            ref={triggerRef}
            type="button"
            aria-haspopup="dialog"
            aria-expanded={picking}
            disabled={isPending}
            onClick={() => setPicking((value) => !value)}
            className="mt-1 flex w-full items-center gap-1.5 rounded-sm px-2 py-1.5 text-xs text-text-subtle transition-colors duration-100 ease-standard hover:bg-surface-hover hover:text-text disabled:opacity-50"
          >
            <PlusIcon className="size-3.5" />
            Add a property
          </button>

          <NewPropertyPopover
            open={picking}
            triggerRef={triggerRef}
            pending={isPending}
            error={error}
            onCreate={create}
            onDismiss={() => {
              setPicking(false);
              setError(undefined);
            }}
          />
        </>
      ) : (
        /* Not a disabled button: a control that refuses is worse than a
           sentence saying who can. */
        defs.length === 0 && (
          <p className="px-2 pb-1 text-2xs text-text-subtle">
            A workspace owner or admin can add properties.
          </p>
        )
      )}
    </section>
  );
}
