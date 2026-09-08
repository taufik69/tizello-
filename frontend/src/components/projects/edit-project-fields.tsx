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
  type ProjectRecord,
  type ProjectStatus,
} from "@/types/project";

/**
 * The body of `EditProjectForm`, split out only to clear the 150-line cap.
 *
 * The KEY is shown and disabled rather than omitted. It is immutable after
 * create (project.md §*Key* 5) because every task id already written into a
 * commit message carries it — but a field that silently disappears in edit
 * reads as a bug, where a visible-and-locked one states the rule.
 *
 * Dates are `type="date"`, so the platform picker enforces the format; whether
 * `endDate` falls before the STORED `startDate` is the API's `422`, since only
 * the server has the half that is not in this form.
 */
const SELECT =
  "h-8 w-full rounded-sm border border-border-strong bg-surface px-2 text-sm text-text";

export type EditProjectDraft = {
  name: string;
  description: string;
  status: ProjectStatus;
  priority: ProjectPriority;
  icon: string;
  color: string;
  startDate: string;
  endDate: string;
};

export function EditProjectFields({
  project,
  draft,
  errors,
  onChange,
}: {
  project: ProjectRecord;
  draft: EditProjectDraft;
  errors: Record<string, string>;
  onChange: (patch: Partial<EditProjectDraft>) => void;
}) {
  return (
    <>
      <div className="mt-4 flex items-center gap-3">
        <ProjectGlyph icon={draft.icon} color={draft.color} size="lg" label="Preview" />
        <div className="min-w-0 flex-1">
          <TextField
            label="Project name"
            name="name"
            autoComplete="off"
            defaultValue={project.name}
            error={errors.name}
            validate={(value) => (value.trim() ? null : "Give your project a name.")}
            onValueChange={(name) => onChange({ name })}
          />
        </div>
        <div className="w-24 shrink-0">
          <TextField
            label="Key"
            name="key"
            defaultValue={project.key}
            helper="Cannot change"
            disabled
            required={false}
          />
        </div>
      </div>

      <div className="mt-4">
        <TextArea
          label="Description"
          name="description"
          defaultValue={project.description ?? ""}
          placeholder="What is this project for?"
          helper="Optional. Shown on the project card and in the table."
          maxLength={2000}
          error={errors.description}
          onValueChange={(description) => onChange({ description })}
        />
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-text-muted">Status</span>
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
          <span className="mb-1 block text-xs font-semibold text-text-muted">Priority</span>
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

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <TextField
          label="Start date"
          name="startDate"
          type="date"
          defaultValue={project.startDate?.slice(0, 10) ?? ""}
          error={errors.startDate}
          required={false}
          onValueChange={(startDate) => onChange({ startDate })}
        />
        <TextField
          label="End date"
          name="endDate"
          type="date"
          defaultValue={project.endDate?.slice(0, 10) ?? ""}
          error={errors.endDate}
          required={false}
          onValueChange={(endDate) => onChange({ endDate })}
        />
      </div>

      <WorkspaceAppearancePicker
        icon={draft.icon}
        color={draft.color}
        onIconChange={(icon) => onChange({ icon })}
        onColorChange={(color) => onChange({ color })}
      />
    </>
  );
}
