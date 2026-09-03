import { nextTaskId } from "@/lib/backlog-groups";
import type { ProjectPerson } from "@/types/project";
import {
  BACKLOG_LABELS,
  type BacklogTask,
  type TaskDraft,
} from "@/types/backlog";

/*
 * Turning a task into a form and a form back into a task.
 *
 * Pure and framework-free, so the editor leaf holds a draft and a submit
 * handler and nothing else. When a real API lands these become the body of the
 * Server Action's payload builder rather than being deleted.
 *
 * NOTHING HERE PERSISTS. Every caller keeps the result in `useState`; a
 * refresh restores the fixture.
 */

export const EMPTY_DRAFT: TaskDraft = {
  title: "",
  description: "",
  priority: "MEDIUM",
  storyPoints: null,
  assigneeId: "",
  labelIds: [],
};

/** The editor's starting value: an existing task flattened, or a blank one. */
export function draftFromTask(task: BacklogTask | null): TaskDraft {
  if (!task) return EMPTY_DRAFT;

  return {
    title: task.title,
    description: task.description ?? "",
    priority: task.priority,
    storyPoints: task.storyPoints ?? null,
    assigneeId: task.assignee?.id ?? "",
    labelIds: task.labels.map((label) => label.id),
  };
}

/**
 * A draft, re-inflated. Empty strings become absent fields rather than empty
 * ones — a task with `description: ""` renders a blank block where a task with
 * no description renders nothing.
 */
export function taskFromDraft(
  draft: TaskDraft,
  { id, assignees }: { id: string; assignees: ProjectPerson[] },
): BacklogTask {
  const description = draft.description.trim();
  const assignee = assignees.find((person) => person.id === draft.assigneeId);

  return {
    id,
    title: draft.title.trim(),
    ...(description ? { description } : {}),
    priority: draft.priority,
    ...(draft.storyPoints ? { storyPoints: draft.storyPoints } : {}),
    ...(assignee ? { assignee } : {}),
    labels: BACKLOG_LABELS.filter((label) => draft.labelIds.includes(label.id)),
    /* Everything created here lands in the backlog. Planning is the only thing
       that may set a sprint — see .claude/rules/workflow.md. */
    sprintId: null,
  };
}

/** Replaces the task with the same id, or appends when there is none. */
export function upsertTask(
  tasks: BacklogTask[],
  task: BacklogTask,
): BacklogTask[] {
  const exists = tasks.some((current) => current.id === task.id);
  return exists
    ? tasks.map((current) => (current.id === task.id ? task : current))
    : [...tasks, task];
}

export function removeTask(tasks: BacklogTask[], id: string): BacklogTask[] {
  return tasks.filter((task) => task.id !== id);
}

/** The quick-add row: a title, everything else left at its default. */
export function quickAddTask(tasks: BacklogTask[], title: string): BacklogTask {
  return taskFromDraft(
    { ...EMPTY_DRAFT, title },
    { id: nextTaskId(tasks), assignees: [] },
  );
}
