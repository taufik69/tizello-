"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  createPropertyDefAction,
  deletePropertyDefAction,
} from "@/lib/actions/project-property-actions";
import { PROJECT_ERROR_COPY } from "@/types/project";
import {
  emptyValueFor,
  PROPERTY_TYPE_LABEL,
  type ProjectPropertyDef,
  type ProjectPropertyPatch,
  type PropertyType,
} from "@/types/project-property";

/**
 * The workspace's property SCHEMA as the drawer holds it: a local list seeded
 * from the server, plus the two writes that change it.
 *
 * Lifted out of `project-property-list.tsx` so that file stays under the
 * 150-line cap, and because definitions and values genuinely are two subjects.
 * A DEFINITION write lands immediately — it changes every project in the
 * workspace, and holding it behind one project's Save would make a column
 * appear for everyone only when one person finished editing, and vanish if
 * they cancelled. A VALUE rides the project's own Save.
 *
 * `defs` is updated in place after the write has already landed, so this is
 * reconciliation rather than optimism.
 */
export function usePropertyDefs({
  workspaceId,
  definitions,
  onPropertiesChange,
}: {
  workspaceId: string;
  definitions: ProjectPropertyDef[];
  onPropertiesChange: (patch: ProjectPropertyPatch) => void;
}) {
  const [defs, setDefs] = useState(definitions);
  const [error, setError] = useState<string | undefined>();
  const [isPending, startTransition] = useTransition();

  /*
   * `inline` is where a failure is REPORTED, and the two callers genuinely
   * differ. "+ Add a property" has a name field to put the message under, so
   * it gets one; anything else has no field at all, and an error set on state
   * nothing renders is an error nobody sees.
   */
  async function createDef(
    input: { name: string; type: PropertyType },
    inline: boolean,
  ): Promise<ProjectPropertyDef | undefined> {
    const result = await createPropertyDefAction(workspaceId, input);

    if (result.code) {
      const message =
        result.code === "CONFLICT"
          ? "A property with that name already exists."
          : (PROJECT_ERROR_COPY[result.code] ?? PROJECT_ERROR_COPY.SERVER_ERROR);

      if (inline) setError(message);
      else toast.error(message);
      return undefined;
    }

    setDefs((current) => [...current, result.property!]);
    setError(undefined);
    return result.property;
  }

  function create(input: { name: string; type: PropertyType }) {
    startTransition(async () => {
      const created = await createDef(input, true);
      if (!created) return;

      /* Seeded to the type's empty value rather than left undefined, so the new
         row renders a usable control instead of an uncontrolled one that warns
         the moment it is typed into. */
      onPropertiesChange({ [created.id]: emptyValueFor(input.type) });
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

  /* The first FILES column is the drawer's Files & media row; any second one
     is an ordinary custom property, since a workspace is free to define two. */
  const files = defs.find((definition) => definition.type === "FILES");

  /**
   * The Files & media column, awaited rather than fired and forgotten.
   *
   * The row that calls this is in the middle of an upload: a file has been
   * picked and there is nowhere to attach it, so the caller needs the
   * definition ITSELF back, not a promise that one will appear in state a
   * render later. Named for the type rather than by the user — it is the one
   * definition this app creates on somebody's behalf, so a name they never
   * typed had better be the obvious one.
   *
   * Nothing is seeded into the value map here: the caller is about to write
   * the real value, and an empty array written first would be a render with
   * the file missing.
   */
  async function ensureFiles(): Promise<ProjectPropertyDef | undefined> {
    return files ?? createDef({ name: PROPERTY_TYPE_LABEL.FILES, type: "FILES" }, false);
  }

  return {
    /** Every definition except the one the Files & media row already draws. */
    custom: defs.filter((definition) => definition !== files),
    files,
    error,
    isPending,
    create,
    remove,
    ensureFiles,
  };
}
