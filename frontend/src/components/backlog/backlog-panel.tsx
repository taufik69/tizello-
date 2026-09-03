"use client";

import { useState } from "react";
import { BacklogEmpty } from "@/components/backlog/backlog-empty";
import { BacklogGroup } from "@/components/backlog/backlog-group";
import { BacklogToolbar } from "@/components/backlog/backlog-toolbar";
import { DeleteTaskDialog } from "@/components/backlog/delete-task-dialog";
import { QuickAddRow } from "@/components/backlog/quick-add-row";
import { TaskDialog } from "@/components/backlog/task-dialog";
import {
  quickAddTask,
  removeTask,
  taskFromDraft,
  upsertTask,
} from "@/lib/backlog-edit";
import { groupByPriority, nextTaskId, totalPoints } from "@/lib/backlog-groups";
import type { BacklogTask, TaskDraft } from "@/types/backlog";
import type { ProjectPerson, ProjectPriority } from "@/types/project";

/*
 * The interactive half of the backlog. The page above stays a Server Component
 * and hands the fetched list down as props; this leaf owns what a static tree
 * cannot: the list as edited, which groups are collapsed, and which task the
 * editor is open on.
 *
 * NOTHING PERSISTS. There is no API and no Server Action behind any of this —
 * every change lives in `useState` and is gone on refresh. When the real
 * endpoints land, each handler becomes an action call plus a revalidate.
 *
 * `editorKey` remounts `TaskDialog` on every open, which is how the draft is
 * seeded from the task without an effect syncing props into state. It changes
 * only while the dialog is closed, so the close path keeps one instance alive
 * and the browser still restores focus to whatever opened it.
 */
export function BacklogPanel({
  tasks: initial,
  assignees,
}: {
  tasks: BacklogTask[];
  assignees: ProjectPerson[];
}) {
  const [tasks, setTasks] = useState(initial);
  const [collapsed, setCollapsed] = useState<ProjectPriority[]>([]);
  const [editing, setEditing] = useState<BacklogTask | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorKey, setEditorKey] = useState(0);
  const [pendingDeletion, setPendingDeletion] = useState<BacklogTask | null>(
    null,
  );

  function openEditor(task: BacklogTask | null) {
    setEditing(task);
    setEditorKey((key) => key + 1);
    setEditorOpen(true);
  }

  function save(draft: TaskDraft) {
    /* Editing keeps the id — it is on screen and printed in the accessible
       name of every control on the row. Creating takes the next in sequence. */
    const id = editing?.id ?? nextTaskId(tasks);
    setTasks((current) =>
      upsertTask(current, taskFromDraft(draft, { id, assignees })),
    );
  }

  function toggle(priority: ProjectPriority) {
    setCollapsed((current) =>
      current.includes(priority)
        ? current.filter((entry) => entry !== priority)
        : [...current, priority],
    );
  }

  return (
    <section>
      <BacklogToolbar
        count={tasks.length}
        points={totalPoints(tasks)}
        onNewTask={() => openEditor(null)}
      />

      {tasks.length === 0 ? (
        <div className="mt-4">
          <BacklogEmpty />
        </div>
      ) : (
        groupByPriority(tasks).map((group) => (
          <BacklogGroup
            key={group.priority}
            priority={group.priority}
            tasks={group.tasks}
            collapsed={collapsed.includes(group.priority)}
            onToggle={() => toggle(group.priority)}
            onEdit={openEditor}
            onDelete={setPendingDeletion}
          />
        ))
      )}

      <QuickAddRow
        onAdd={(title) =>
          setTasks((current) => upsertTask(current, quickAddTask(current, title)))
        }
      />

      <DeleteTaskDialog
        task={pendingDeletion}
        onOpenChange={() => setPendingDeletion(null)}
        onConfirm={() => {
          setTasks((current) => removeTask(current, pendingDeletion?.id ?? ""));
          setPendingDeletion(null);
        }}
      />

      <TaskDialog
        key={editorKey}
        open={editorOpen}
        task={editing}
        assignees={assignees}
        onOpenChange={setEditorOpen}
        onSave={save}
      />
    </section>
  );
}
