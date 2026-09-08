"use client";

import { useRef, useState } from "react";
import { DragDropProvider } from "@dnd-kit/react";
import { move } from "@dnd-kit/helpers";
import { BOARD_SENSORS } from "@/components/projects/board-sensors";
import { ProjectBoardColumn } from "@/components/projects/project-board-column";
import type { ProjectScope } from "@/components/projects/project-properties";
import { useProjectStatusWrite } from "@/components/projects/use-project-status-write";
import {
  baseColumns,
  columnProjects,
  reconcile,
  statusOf,
  type ColumnMap,
} from "@/lib/project-board-order";
import { canWriteProject } from "@/lib/project-roles";
import {
  PROJECT_STATUSES,
  type ProjectRecord,
  type ProjectStatus,
} from "@/types/project";
import type { WorkspaceRole } from "@/types/workspace";

/**
 * The six status columns and the drag engine over them.
 *
 * `@dnd-kit/react` rather than the `@dnd-kit/core` the sprint board uses, and
 * the difference is what you see: its sortable moves the REAL cards out of the
 * way as a card passes over them, so the board previews the arrangement rather
 * than drawing a placeholder that describes it. It also owns the optimistic
 * update and reverts it itself when a drag is cancelled.
 *
 * WHAT IS CONTROLLED AND WHAT IS NOT. The library needs a
 * `Record<column, ids>` to sort against, and `move()` returns the next one on
 * every `dragover`. That map is client state; the projects in it come from the
 * server. `reconcile` derives one from the other during render, which is what
 * keeps a project created in another tab from needing an effect to appear —
 * `lib/project-board-order.ts` documents the set arithmetic.
 *
 * ONLY THE COLUMN IS SAVED. `Project` has no rank field, so the order a card
 * is dropped at holds for the session and the server's order returns on
 * reload. The status does not: that is a `PATCH` on `dragend`, and the only
 * thing about this gesture that outlives the tab.
 *
 * THE WHOLE CARD IS GRABBABLE, not just its grip — `board-sensors.ts` widens
 * the pointer's activator and puts an 8px threshold on it so the card's own
 * link still opens on a plain click.
 *
 * A CANCELLED DRAG RESTORES THE SNAPSHOT taken at `dragstart`. dnd-kit reverts
 * its own optimistic state, but the map above is ours and it has already been
 * moved by every `dragover` on the way — so Escape has to put it back.
 */
export function ProjectBoard({
  projects,
  scope,
  workspaceRole,
}: {
  projects: ProjectRecord[];
  scope: ProjectScope;
  workspaceRole: WorkspaceRole;
}) {
  const write = useProjectStatusWrite(scope.workspaceId);
  const [stored, setStored] = useState<ColumnMap | null>(null);
  const [dragging, setDragging] = useState(false);
  const snapshot = useRef<ColumnMap | null>(null);

  const base = baseColumns(projects);
  const columns = reconcile(base, stored);
  const canMove = (project: ProjectRecord) =>
    canWriteProject(workspaceRole, project.viewerRole);

  return (
    <DragDropProvider
      sensors={BOARD_SENSORS}
      onDragStart={() => {
        setDragging(true);
        snapshot.current = columns;
      }}
      /* Every `dragover` re-sorts the map, which is what the cards animate to.
         The updater form reconciles against the CURRENT props each time — drag
         events arrive faster than React re-renders, and a stale closure would
         sort a map two events old. */
      onDragOver={(event) => {
        setStored((current) => move(reconcile(base, current), event));
      }}
      onDragEnd={(event) => {
        setDragging(false);

        if (event.canceled) {
          setStored(snapshot.current);
          return;
        }

        /* NO `move()` HERE, and its absence is the fix for a card that shook
           as it landed. `dragover` has already sorted the map into its final
           state; moving it again commits a second render while dnd-kit is
           mid-drop-animation, and React reordering the same `<li>`s under an
           animation that is tweening them is exactly what the shake was. The
           library's own example handles items in `dragover` alone for the
           same reason. */
        const id = String(event.operation.source?.id ?? "");
        const project = projects.find((entry) => entry.id === id);
        /* `from` comes from the snapshot and `to` from the EVENT, not from the
           map either side of it. `dragend` can arrive in the same tick as the
           last `dragover`, before React has re-rendered — so a map read here
           can be one move stale, where the event names the target it actually
           resolved to. */
        const from = statusOf(snapshot.current ?? base, id);
        const to = targetStatus(event.operation.target);

        /* Same column, different rank: nothing to write, because there is
           nowhere to write a rank to. */
        if (project && from && to && from !== to) write(project.id, project.name, to);
      }}
    >
      {/*
       * `overscroll-x-contain` keeps a drag that runs off the end of the rail
       * from chaining into the page's own scroll — the board moves, the page
       * behind it does not.
       *
       * `items-stretch` and `min-h-board` are the other half of the shake fix
       * that `--spacing-board` documents: every column is the same height and
       * that height has a floor, so a card crossing between two changes no
       * box, moves no scrollbar, and cannot un-trigger its own collision.
       */}
      <div className="scrollbar-board -mx-4 overflow-x-auto overscroll-x-contain px-4 pb-2 sm:-mx-6 sm:px-6">
        <div className="flex min-h-board items-stretch gap-4">
          {PROJECT_STATUSES.map((status) => (
            <ProjectBoardColumn
              key={status}
              status={status}
              projects={columnProjects(projects, columns[status])}
              scope={scope}
              canMove={canMove}
              dragging={dragging}
            />
          ))}
        </div>
      </div>
    </DragDropProvider>
  );
}

/**
 * The status a drop resolved to, read off the drop target itself.
 *
 * Two shapes reach here and both mean a column: the column's own droppable,
 * whose `id` IS the status, and a sortable CARD, whose `group` is the status
 * of the column it sits in. Narrowed structurally rather than by importing the
 * library's classes — this only needs three fields, and a `0.5.x` dependency
 * is not one to couple type assertions to.
 */
function targetStatus(target: unknown): ProjectStatus | null {
  if (!target || typeof target !== "object") return null;

  const { type, id, group } = target as {
    type?: unknown;
    id?: unknown;
    group?: unknown;
  };
  const value = type === "column" ? id : group;

  return typeof value === "string" &&
    (PROJECT_STATUSES as readonly string[]).includes(value)
    ? (value as ProjectStatus)
    : null;
}
