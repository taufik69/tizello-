"use client";

import { AddPropertyMenu } from "@/components/projects/add-property-menu";
import { CustomPropertiesSection } from "@/components/projects/custom-properties-section";
import { ProjectEnumSelects } from "@/components/projects/project-enum-selects";
import { PropertyRow } from "@/components/projects/property-row";
import {
  clearProperty,
  PROPERTY_META,
  type OptionalProperty,
  type ProjectDraft,
} from "@/components/projects/project-properties";
import { DateField } from "@/components/ui/date-field";
import { TextArea } from "@/components/ui/text-area";
import { TextField } from "@/components/ui/text-field";
import { WorkspaceAppearancePicker } from "@/components/workspace/workspace-appearance-picker";
import type {
  ProjectPropertyDef,
  ProjectPropertyPatch,
} from "@/types/project-property";

/**
 * The property list shared by the create and edit drawers.
 *
 * The four required rows are always drawn; the optional ones appear as they are
 * added and disappear when removed. Removing a row CLEARS its value
 * (`clearProperty`) rather than just hiding it — a hidden-but-still-sent field
 * is how a "removed" description survives a save.
 *
 * `keyEditable` is false on edit: the key is immutable after create because
 * every task id already written into a commit message carries it, and the row
 * is shown disabled rather than dropped, because a field that silently
 * disappears in edit reads as a bug where a locked one states the rule.
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
}: {
  draft: ProjectDraft;
  errors: Record<string, string>;
  today: string;
  shown: OptionalProperty[];
  keyEditable: boolean;
  workspaceId: string;
  /** The workspace's custom-property schema. */
  definitions: ProjectPropertyDef[];
  /** This project's values for them, keyed by definition id. */
  values: ProjectPropertyPatch;
  canManageProperties: boolean;
  onChange: (patch: Partial<ProjectDraft>) => void;
  onShownChange: (next: OptionalProperty[]) => void;
  onPropertiesChange: (patch: ProjectPropertyPatch) => void;
}) {
  function remove(property: OptionalProperty) {
    onChange(clearProperty(draft, property));
    onShownChange(shown.filter((entry) => entry !== property));
  }

  return (
    <div className="mt-4">
      <PropertyRow label="Key" icon="text">
        <TextField
          label="Key"
          name="key"
          autoComplete="off"
          maxLength={5}
          defaultValue={draft.key}
          placeholder={keyEditable ? "Auto" : undefined}
          helper={keyEditable ? "Left blank, one is derived from the name" : "Cannot change"}
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

      <ProjectEnumSelects
        status={draft.status}
        priority={draft.priority}
        onStatusChange={(status) => onChange({ status })}
        onPriorityChange={(priority) => onChange({ priority })}
      />

      {shown.includes("description") && (
        <PropertyRow
          label={PROPERTY_META.description.label}
          icon="text"
          onRemove={() => remove("description")}
        >
          <TextArea
            label="Description"
            name="description"
            defaultValue={draft.description}
            placeholder="What is this project for?"
            maxLength={2000}
            error={errors.description}
            onValueChange={(description) => onChange({ description })}
          />
        </PropertyRow>
      )}

      {shown.includes("dates") && (
        <PropertyRow
          label={PROPERTY_META.dates.label}
          icon="calendar"
          onRemove={() => remove("dates")}
        >
          <div className="grid gap-2 sm:grid-cols-2">
            <DateField
              label="Start"
              value={draft.startDate}
              today={today}
              error={errors.startDate}
              onChange={(startDate) => onChange({ startDate })}
            />
            <DateField
              label="End"
              value={draft.endDate}
              today={today}
              error={errors.endDate}
              onChange={(endDate) => onChange({ endDate })}
            />
          </div>
        </PropertyRow>
      )}

      {shown.includes("appearance") && (
        <PropertyRow
          label={PROPERTY_META.appearance.label}
          icon="palette"
          onRemove={() => remove("appearance")}
        >
          <WorkspaceAppearancePicker
            icon={draft.icon}
            color={draft.color}
            onIconChange={(icon) => onChange({ icon })}
            onColorChange={(color) => onChange({ color })}
          />
        </PropertyRow>
      )}

      <AddPropertyMenu
        shown={shown}
        onAdd={(property) => onShownChange([...shown, property])}
      />

      {/* The workspace's own columns, below the project's built-in fields.
          Definitions save immediately (they change every project in the
          workspace); the values below save with this project. */}
      <CustomPropertiesSection
        workspaceId={workspaceId}
        definitions={definitions}
        values={values}
        today={today}
        canManage={canManageProperties}
        onChange={onPropertiesChange}
      />
    </div>
  );
}
