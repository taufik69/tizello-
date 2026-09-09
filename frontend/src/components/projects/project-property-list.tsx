"use client";

import { useRef } from "react";
import { AddPropertyMenu } from "@/components/projects/add-property-menu";
import { CustomPropertyRow } from "@/components/projects/custom-property-row";
import { FilesRow } from "@/components/projects/files-row";
import { PropertyRow } from "@/components/projects/property-row";
import {
  clearProperty,
  type OptionalProperty,
  type ProjectDraft,
} from "@/components/projects/project-properties";
import { ProjectFieldRows } from "@/components/projects/project-field-rows";
import { TextField } from "@/components/ui/text-field";
import { usePropertyDefs } from "@/components/projects/use-property-defs";
import type {
  ProjectPropertyDef,
  ProjectPropertyPatch,
  PropertyValue,
} from "@/types/project-property";
import { PropertySelects } from "@/components/projects/property-selects";

/**
 * Every property of a project as one aligned list: the built-in fields first,
 * then the workspace's custom columns, then a single "+ Add a property".
 *
 * EVERY ROW GOES THROUGH `PropertyRow`, including Key, Status and Priority.
 * Those three used to be laid out on their own and broke the two-column grid —
 * a label above the field instead of beside it, so nothing lined up down the
 * left edge. One row component is what makes the column a column.
 *
 * DEFINITIONS AND VALUES SAVE AT DIFFERENT TIMES, and that is what the two
 * things are rather than an inconsistency: a DEFINITION write lands
 * immediately because it changes every project in the workspace, and a VALUE
 * rides this project's own Save. `use-property-defs.ts` owns the first half
 * and says why at length; this file only arranges the rows.
 *
 * TWO ROWS ARE HOISTED OUT OF THE CUSTOM LOOP AND ALWAYS DRAWN. Collaborators
 * arrives from the caller as `people`, because who fills it differs between
 * create and edit (`collaborators-draft-row.tsx` says why). Files & media is
 * the workspace's one `FILES` column, pulled to a fixed position rather than
 * left wherever `position` put it — it is the row people look for on a new
 * project, and `files-row.tsx` draws it even before the column exists.
 */
export function ProjectPropertyList({
  draft,
  errors,
  today,
  shown,
  keyEditable,
  workspaceId,
  definitions,
  values,
  canManageProperties,
  onChange,
  onShownChange,
  onPropertiesChange,
  people,
  meta,
}: {
  draft: ProjectDraft;
  errors: Record<string, string>;
  today: string;
  shown: OptionalProperty[];
  keyEditable: boolean;
  workspaceId: string;
  definitions: ProjectPropertyDef[];
  values: ProjectPropertyPatch;
  canManageProperties: boolean;
  onChange: (patch: Partial<ProjectDraft>) => void;
  onShownChange: (next: OptionalProperty[]) => void;
  onPropertiesChange: (patch: ProjectPropertyPatch) => void;
  /** The Collaborators row. Staged on create, live on edit — the caller decides which. */
  people?: React.ReactNode;
  /** Read-only facts (owner, created, updated). Edit only — a project that does not exist yet has none. */
  meta?: React.ReactNode;
}) {
  const schema = usePropertyDefs({ workspaceId, definitions, onPropertiesChange });
  const listRef = useRef<HTMLDivElement>(null);

  function removeField(property: OptionalProperty) {
    onChange(clearProperty(draft, property));
    onShownChange(shown.filter((entry) => entry !== property));
  }

  /* The column is resolved — and created, the first time — as part of the
     write rather than before it, so attaching a file is one gesture. See
     `files-row.tsx`. */
  async function attachFiles(value: PropertyValue) {
    const definition = await schema.ensureFiles();
    if (!definition) return;

    onPropertiesChange({ [definition.id]: value });
  }

  return (
    <div ref={listRef} className="mt-5">
      <PropertyRow label="Key" icon="hash">
        <TextField
          label="Key"
          hideLabel
          ghost
          name="key"
          autoComplete="off"
          maxLength={5}
          /* CONTROLLED on create, uncontrolled on edit. The create drawer
             derives this from the name as it is typed (`use-project-draft.ts`),
             and a `defaultValue` would ignore every keystroke after the first
             render. The edit drawer has no name to follow and is disabled, so
             it keeps the cheaper seed. */
          value={keyEditable ? draft.key : undefined}
          defaultValue={draft.key}
          placeholder={keyEditable ? "Auto — derived from the name" : undefined}
          disabled={!keyEditable}
          required={false}
          error={errors.key}
          /* Uppercased as it is typed: the API's pattern is uppercase-only, so
             a lowercase key is a `400` the user cannot see coming. A pure 1:1
             map — the length cap is `maxLength`, so the caret survives editing
             mid-value. */
          transform={(value) => value.toUpperCase()}
          onValueChange={(key) => onChange({ key })}
        />
      </PropertyRow>

      <PropertySelects
        status={draft.status}
        priority={draft.priority}
        onStatusChange={(status) => onChange({ status })}
        onPriorityChange={(priority) => onChange({ priority })}
      />

      <ProjectFieldRows
        draft={draft}
        errors={errors}
        today={today}
        shown={shown}
        onChange={onChange}
        onRemove={removeField}
      />

      {people}

      <FilesRow
        definition={schema.files}
        value={
          schema.files
            ? ((values[schema.files.id] ?? undefined) as PropertyValue | undefined)
            : undefined
        }
        canManage={canManageProperties}
        onAttach={attachFiles}
      />

      {schema.custom.map((definition) => (
        <CustomPropertyRow
          key={definition.id}
          definition={definition}
          value={(values[definition.id] ?? undefined) as PropertyValue | undefined}
          today={today}
          canManage={canManageProperties}
          onChange={(value) => onPropertiesChange({ [definition.id]: value })}
          onDeleteDefinition={() => schema.remove(definition)}
        />
      ))}

      {meta}

      <AddPropertyMenu
        shown={shown}
        canManage={canManageProperties}
        pending={schema.isPending}
        error={schema.error}
        onAddField={(property) => onShownChange([...shown, property])}
        onCreateProperty={schema.create}
      />
    </div>
  );
}
