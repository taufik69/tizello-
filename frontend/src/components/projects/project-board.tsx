"use client";

import { useCallback, useRef, useState } from "react";
import { ProjectBoardColumn } from "@/components/projects/project-board-column";
import type { ProjectScope } from "@/components/projects/project-properties";
import { useBoardPan } from "@/components/projects/use-board-pan";
import { useProjectBoardDnd } from "@/components/projects/use-project-board-dnd";
import { useProjectStatusWrite } from "@/components/projects/use-project-status-write";
import type { DragTarget } from "@/lib/board-drag";
import {
  baseColumns,
  columnProjects,
  place,
  reconcile,
  statusOf,
  type ColumnMap,
} from "@/lib/project-board-order";
import { cn } from "@/lib/cn";
import { canWriteProject } from "@/lib/project-roles";
import { PROJECT_STATUSES, type ProjectRecord } from "@/types/project";
import type { WorkspaceRole } from "@/types/workspace";

/**
 * The six status columns and the drag gesture over them.
 *
 * HAND-ROLLED, NOT @dnd-kit, AND THE REASON IS THE JITTER. The library's
 * sortable is controlled: it wants the column map mutated on every `dragover`,
 * so the list reordered under the pointer, every reorder re-measured, and a
 * re-measure could resolve to a different target than the one that produced it
 * — the cards in the hovered column shuffled continuously for as long as a card
 * was held. `lib/board-drag.ts` tells that story in full and holds the
 * arithmetic; `use-project-board-dnd.ts` owns the pointer.
 *
 * THE POINT OF THE REPLACEMENT IS THAT THIS COMPONENT'S STATE DOES NOT MOVE
 * DURING A DRAG. `stored` is written ONCE, in `onDrop`. Everything visible in
 * between is a `transform`, which composites and reflows nothing — so there is
 * no measurement for the next frame to disagree with, and the loop cannot
 * exist rather than being damped.
 *
 * WHAT IS CONTROLLED AND WHAT IS NOT. The board renders from a
 * `Record<column, ids>`; that map is client state, and the projects in it come
 * from the server. `reconcile` derives one from the other during render, which
 * is what keeps a project created in another tab from needing an effect to
 * appear — `lib/project-board-order.ts` documents the set arithmetic.
 *
 * ONLY THE COLUMN IS SAVED. `Project` has no rank field, so the order a card
 * is dropped at holds for the session and the server's order returns on
 * reload. The status does not: that is a `PATCH` on drop, and the only thing
 * about this gesture that outlives the tab.
 *
 * THE RAIL HAS NO SCROLLBAR AND PANS INSTEAD — `scrollbar-hidden` plus
 * `use-board-pan.ts`, which turns the background into a grab surface. Grabbing
 * a CARD is the drag above; the two are told apart by where the press landed.
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
  const rail = useRef<HTMLDivElement>(null);

  const base = baseColumns(projects);
  const columns = reconcile(base, stored);
  const canMove = (project: ProjectRecord) =>
    canWriteProject(workspaceRole, project.viewerRole);

  /* `projects` and `columns` are read through the updater rather than captured,
     so a drop that lands after a revalidation still moves the card within the
     map the user was actually looking at. */
  const onDrop = useCallback(
    (id: string, target: DragTarget) => {
      const project = projects.find((entry) => entry.id === id);
      if (!project) return;

      const current = reconcile(baseColumns(projects), stored);
      const from = statusOf(current, id);

      setStored(place(current, id, target.status, target.index));

      /* Same column, different rank: nothing to write, because there is
         nowhere to write a rank to. */
      if (from && from !== target.status) write(id, project.name, target.status);
    },
    [projects, stored, write],
  );

  const dnd = useProjectBoardDnd({ railRef: rail, onDrop });
  const pan = useBoardPan(rail, Boolean(dnd.drag));

  return (
    /*
     * `overscroll-x-contain` keeps a pan that runs off the end of the rail from
     * chaining into the page's own scroll — the board moves, the page behind it
     * does not.
     *
     * `items-stretch` and `min-h-board` make every column the same height with
     * a floor under it, so the rail's box does not depend on which column
     * happens to be tallest.
     *
     * `cursor-grab` sits on the rail rather than the inner track so the padding
     * either side of the columns is grabbable too — the strip down the left
     * edge of the board is background like any other.
     */
    <div
      ref={rail}
      {...pan.handlers}
      className={cn(
        "scrollbar-hidden -mx-4 overflow-x-auto overscroll-x-contain px-4 pb-2 sm:-mx-6 sm:px-6",
        pan.panning ? "cursor-grabbing select-none" : "cursor-grab",
      )}
    >
      <div className="flex min-h-board items-stretch gap-4">
        {PROJECT_STATUSES.map((status) => (
          <ProjectBoardColumn
            key={status}
            status={status}
            projects={columnProjects(projects, columns[status])}
            scope={scope}
            canMove={canMove}
            drag={dnd.drag}
            onPointerDown={dnd.onPointerDown}
          />
        ))}
      </div>
    </div>
  );
}
