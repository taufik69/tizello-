"use client";

import { ProjectGlyph } from "@/components/projects/project-glyph";
import { TextArea } from "@/components/ui/text-area";
import { TextField } from "@/components/ui/text-field";
import { WorkspaceAppearancePicker } from "@/components/workspace/workspace-appearance-picker";
import {
  PROJECT_PRIORITIES,
  PROJECT_PRIORITY_LABEL,
  PROJECT_STATUSES,
  PROJECT_STATUS_LABEL,
  type ProjectPriority,
  type ProjectStatus,
} from "@/types/project";

/**
 * The body of `CreateProjectDialog`, split out only to clear the 150-line cap.
 * Every field is a controlled input with no state of its own.
 *
 * `key` is offered but never required. Left blank, the API derives one from
 * the name and silently suffixes a collision; typed in, a collision is a `409`
 * the user has to resolve — so the helper says what blank means rather than
 * leaving the field looking mandatory. It is uppercased on the way out, in the
 * action, not here: fighting the user's shift key mid-word is worse than
 * normalising once at submit.
 */
const SELECT =
  "h-8 w-full rounded-sm border border-border-strong bg-surface px-2 text-sm text-text";

export type CreateProjectDraft = {
  name: string;
  key: string;
  description: string;
  status: ProjectStatus;
  priority: ProjectPriority;
  icon: string;
  color: string;
};

export function CreateProjectFields({
  draft,
  errors,
  onChange,
}: {
  draft: CreateProjectDraft;
  errors: Record<string, string>;
  onChange: (patch: Partial<CreateProjectDraft>) => void;
}) {
  return (
    <>
      {/* Live preview. The glyph is the same component the tables, the board
          and the workspace grid draw, so what the picker below shows IS what
          lands on the card — a bespoke swatch here could drift from all four.
          `label` gives it the accessible name the decorative instances skip.

          `key` is deliberately not previewed: it is derived server-side when
          left blank, and showing a guess the API may suffix on collision
          would be a promise this dialog cannot keep. */}
      <div className="mt-4 flex items-center gap-3 rounded-md border border-border bg-surface-sunken p-3">
        <ProjectGlyph
          icon={draft.icon}
          color={draft.color}
          size="lg"
          label="Preview"
        />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-text">
            {draft.name.trim() || "New project"}
          </p>
          <p className="truncate text-2xs text-text-subtle">
            {draft.description.trim() || "No description yet"}
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]">
        <TextField
          label="Project name"
          name="name"
          placeholder="e.g. Website redesign"
          autoComplete="off"
          autoFocus
          error={errors.name}
          validate={(value) => (value.trim() ? null : "Give your project a name.")}
          onValueChange={(name) => onChange({ name })}
        />
        <div className="sm:w-28">
          <TextField
            label="Key"
            name="key"
            placeholder="Auto"
            autoComplete="off"
            maxLength={5}
            helper="Task prefix"
            error={errors.key}
            /* Uppercased as it is typed rather than at submit: the API's
               pattern is uppercase-only, so a lowercase key is a `400` the
               user cannot see coming from a field that happily accepted it.
               A pure 1:1 map — the 5-char cap is `maxLength` above, so the
               caret survives editing mid-value. */
            transform={(value) => value.toUpperCase()}
            onValueChange={(key) => onChange({ key })}
          />
        </div>
      </div>

      <div className="mt-4">
        <TextArea
          label="Description"
          name="description"
          placeholder="What is this project for?"
          helper="Optional. Shown on the project card and its detail page."
          maxLength={2000}
          onValueChange={(description) => onChange({ description })}
        />
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-text">Status</span>
          <select
            name="status"
            value={draft.status}
            onChange={(event) => onChange({ status: event.target.value as ProjectStatus })}
            className={SELECT}
          >
            {PROJECT_STATUSES.map((status) => (
              <option key={status} value={status}>
                {PROJECT_STATUS_LABEL[status]}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-text">Priority</span>
          <select
            name="priority"
            value={draft.priority}
            onChange={(event) => onChange({ priority: event.target.value as ProjectPriority })}
            className={SELECT}
          >
            {PROJECT_PRIORITIES.map((priority) => (
              <option key={priority} value={priority}>
                {PROJECT_PRIORITY_LABEL[priority]}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* The same picker the workspace dialog uses — a project's icon and
          colour are the same two columns, so a second one would be two places
          for the palette to drift. */}
      <WorkspaceAppearancePicker
        icon={draft.icon}
        color={draft.color}
        onIconChange={(icon) => onChange({ icon })}
        onColorChange={(color) => onChange({ color })}
      />
    </>
  );
}
