"use client";

import { TaskAssigneeChoice } from "@/components/backlog/task-assignee-choice";
import { TaskChoiceGroup, type Choice } from "@/components/backlog/task-choice-group";
import { TaskDescriptionField } from "@/components/backlog/task-description-field";
import { TaskLabelsChoice } from "@/components/backlog/task-labels-choice";
import { PRIORITY_LABEL } from "@/lib/project-groups";
import { PROJECT_PRIORITIES, type ProjectPerson } from "@/types/project";
import { STORY_POINT_SCALE, type TaskDraft } from "@/types/backlog";

/*
 * Everything in the editor below the title. Split out so `TaskDialog` is the
 * dialog, the validation and the footer, and nothing else — either half alone
 * would be over the 150-line cap.
 *
 * The lookups are built here, once, rather than inside the render of each
 * control.
 */
const PRIORITY_CHOICES: Choice[] = PROJECT_PRIORITIES.map((priority) => ({
  value: priority,
  label: PRIORITY_LABEL[priority],
}));

/* `""` is "unestimated", which is NOT the same as zero — a task nobody has
   sized yet must not contribute a 0 to a sprint total. */
const POINT_CHOICES: Choice[] = [
  { value: "", label: "None" },
  ...STORY_POINT_SCALE.map((points) => ({
    value: String(points),
    label: String(points),
  })),
];

export function TaskFormFields({
  draft,
  assignees,
  priorityName,
  pointsName,
  onChange,
}: {
  draft: TaskDraft;
  assignees: ProjectPerson[];
  /** Ids, not class names, so two editors on a page cannot share a selection. */
  priorityName: string;
  pointsName: string;
  onChange: (patch: Partial<TaskDraft>) => void;
}) {
  return (
    <>
      <TaskDescriptionField
        value={draft.description}
        onChange={(description) => onChange({ description })}
      />

      <TaskChoiceGroup
        legend="Priority"
        name={priorityName}
        choices={PRIORITY_CHOICES}
        value={draft.priority}
        onChange={(value) => {
          /* Narrowed against the canonical list rather than cast: the radio's
             value arrives as a plain string. */
          const priority = PROJECT_PRIORITIES.find((entry) => entry === value);
          if (priority) onChange({ priority });
        }}
      />

      <TaskChoiceGroup
        legend="Story points"
        name={pointsName}
        choices={POINT_CHOICES}
        value={draft.storyPoints === null ? "" : String(draft.storyPoints)}
        hint="Fibonacci — the gaps widen as the confidence drops."
        onChange={(value) =>
          onChange({ storyPoints: value === "" ? null : Number(value) })
        }
      />

      <TaskAssigneeChoice
        assignees={assignees}
        value={draft.assigneeId}
        onChange={(assigneeId) => onChange({ assigneeId })}
      />

      <TaskLabelsChoice
        selected={draft.labelIds}
        onToggle={(labelId) =>
          onChange({
            labelIds: draft.labelIds.includes(labelId)
              ? draft.labelIds.filter((id) => id !== labelId)
              : [...draft.labelIds, labelId],
          })
        }
      />
    </>
  );
}
