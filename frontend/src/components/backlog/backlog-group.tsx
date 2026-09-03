"use client";

import { useId } from "react";
import { BacklogGroupHeader } from "@/components/backlog/backlog-group-header";
import { BacklogRow } from "@/components/backlog/backlog-row";
import { totalPoints } from "@/lib/backlog-groups";
import { PRIORITY_LABEL } from "@/lib/project-groups";
import type { BacklogTask } from "@/types/backlog";
import type { ProjectPriority } from "@/types/project";

/*
 * One priority band: its header and the rows under it.
 *
 * The list is hidden with `hidden` rather than unmounted — `aria-controls` has
 * to point at an element that exists, and the same reasoning `TabPanel`
 * documents applies here.
 *
 * Rows are keyed on the task id, never the index: a delete anywhere but the end
 * would otherwise hand the wrong open menu to the wrong task.
 */
export function BacklogGroup({
  priority,
  tasks,
  collapsed,
  onToggle,
  onEdit,
  onDelete,
}: {
  priority: ProjectPriority;
  tasks: BacklogTask[];
  collapsed: boolean;
  onToggle: () => void;
  onEdit: (task: BacklogTask) => void;
  onDelete: (task: BacklogTask) => void;
}) {
  const panelId = useId();

  return (
    <section className="mt-4 first:mt-3">
      <BacklogGroupHeader
        priority={priority}
        count={tasks.length}
        points={totalPoints(tasks)}
        collapsed={collapsed}
        panelId={panelId}
        onToggle={onToggle}
      />

      <ul id={panelId} hidden={collapsed} className="mt-1.5 space-y-1.5">
        {tasks.length === 0 ? (
          <li className="rounded-md border border-dashed border-border px-3 py-4 text-center text-xs text-text-subtle">
            Nothing at {PRIORITY_LABEL[priority].toLowerCase()} priority.
          </li>
        ) : (
          tasks.map((task) => (
            <li key={task.id}>
              <BacklogRow
                task={task}
                onEdit={() => onEdit(task)}
                onDelete={() => onDelete(task)}
              />
            </li>
          ))
        )}
      </ul>
    </section>
  );
}
