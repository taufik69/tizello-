"use client";

import { FilesValueField } from "@/components/projects/files-value-field";
import { PropertyRow } from "@/components/projects/property-row";
import type {
  ProjectPropertyDef,
  PropertyValue,
} from "@/types/project-property";

/**
 * Files & media, drawn on every drawer whether or not the workspace has the
 * column yet.
 *
 * WHERE THE FILES ACTUALLY GO. `Project` has no attachments column —
 * `backend/prisma/schema.prisma` gives it no JSON field at all — so the only
 * storage this app has for them is a workspace property definition of type
 * `FILES`, whose values ride `PATCH /projects/:id` like every other property.
 * That is why this row is bound to a definition rather than to a field of the
 * draft.
 *
 * ONE CLICK OPENS THE FILE PICKER, and getting that wrong is what made the row
 * look broken. The first version drew a provision button in the definition's
 * place: clicking it created the workspace column and opened nothing, so the
 * gesture that says "attach a file" did nothing visible and the second,
 * identical-looking click was the one that worked.
 *
 * The column is created inside the upload instead — `onAttach` awaits
 * `ensureFiles()` before it writes — so the schema write is still a
 * consequence of a user action, and the action is the one the user meant.
 * Provisioning is workspace-admin-only, exactly as the "+ Add a property" menu
 * is, so someone who cannot create it and has no column yet gets a sentence
 * saying who can rather than a control that will fail.
 */
export function FilesRow({
  definition,
  value,
  canManage,
  onAttach,
}: {
  /** The workspace's `FILES` column, or `undefined` until one exists. */
  definition?: ProjectPropertyDef;
  value: PropertyValue | undefined;
  canManage: boolean;
  /** Writes the value, creating the column first when there is not one yet. */
  onAttach: (value: PropertyValue) => Promise<void>;
}) {
  if (!definition && !canManage) {
    return (
      <PropertyRow label="Files & media" icon="files">
        <div className="rounded-sm border border-transparent px-2.5 py-1.5">
          <p className="text-sm text-text-subtle">
            A workspace admin can add a Files &amp; media property.
          </p>
        </div>
      </PropertyRow>
    );
  }

  return (
    <PropertyRow label={definition?.name ?? "Files & media"} icon="files">
      <FilesValueField
        value={Array.isArray(value) ? value : []}
        onChange={onAttach}
      />
    </PropertyRow>
  );
}
