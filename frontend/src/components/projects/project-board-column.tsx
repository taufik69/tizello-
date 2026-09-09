"use client";

import { CollisionPriority } from "@dnd-kit/abstract";
import { useDroppable } from "@dnd-kit/react";
import type { ProjectScope } from "@/components/projects/project-properties";
import { NewProjectTrigger } from "@/components/projects/new-project-trigger";
import { SortableProjectCard } from "@/components/projects/sortable-project-card";
import { STATUS_BAR } from "@/components/projects/project-tone";
import { StatusDot } from "@/components/projects/status-dot";
import { cn } from "@/lib/cn";
import { plural } from "@/lib/plural";
import { STATUS_LABEL } from "@/lib/project-groups";
import type { ProjectRecord, ProjectStatus } from "@/types/project";

/*
 * One kanban column, and the drop target inside it.
 *
 * `w-list` is Trello's 272px, the same width every other column in this app
 * uses.
 *
 * THE DROPPABLE IS THE TRACK, NOT THE SECTION. The heading has to stay
 * untinted — its status dot needs `bg-surface` under it to clear 3:1
 * (DESIGN-SYSTEM.md) — so scoping the droppable to the track is what lets the
 * track light up while the heading holds still, and it stops a drop landing on
 * a heading, which means nothing.
 *
 * `CollisionPriority.Low` is what makes the cards win. A column's box contains
 * every card in it, so without this the column and the card under the cursor
 * collide equally and the sort never resolves to a position — the card would
 * only ever land at the end. Low priority means the column is consulted when
 * no card is: over the gaps, and over an EMPTY column, which is the case it
 * exists for.
 *
 * `STATUS_BAR` is reused for the lit state rather than a new pair: it is
 * already "a tinted fill for recognition, a hairline in the strong token for
 * the edge", measured against `surface`, which is exactly this job.
 *
 * `min-h-28` IS THE FIX FOR A CARD THAT SHOOK ON ITS WAY IN, and the loop it
 * breaks is worth writing down because nothing about it is visible in the
 * styling:
 *
 *   card enters an empty column → the empty state unmounts → the track shrinks
 *   → its bottom edge passes back above the cursor → the card is no longer
 *   over the column → it leaves → the empty state returns → the track grows →
 *   the cursor is inside again → repeat, every frame.
 *
 * A minimum tall enough to hold one card means the track's box does not change
 * when its contents do, so the collision that started the move cannot be
 * undone by the move itself. Only `transition`s that never affect layout are
 * allowed on it, for the same reason.
 */
const TRACK =
  "flex min-h-28 flex-col gap-2 rounded-md border border-transparent p-1 transition-[background-color,border-color,box-shadow] duration-100 ease-standard";

export function ProjectBoardColumn({
  status,
  projects,
  scope,
  canMove,
  dragging,
}: {
  status: ProjectStatus;
  /** Already in the column map's order — see `lib/project-board-order.ts`. */
  projects: ProjectRecord[];
  scope: ProjectScope;
  /** Decides which cards offer a handle — see `SortableProjectCard`. */
  canMove: (project: ProjectRecord) => boolean;
  /** Anything at all is being dragged — dims the columns that are not the target. */
  dragging: boolean;
}) {
  const headingId = `board-column-${status}`;
  const { ref, isDropTarget } = useDroppable({
    id: status,
    type: "column",
    accept: "item",
    collisionPriority: CollisionPriority.Low,
  });

  return (
    <section
      aria-labelledby={headingId}
      className={cn(
        "flex w-list shrink-0 flex-col gap-2 transition-opacity duration-100 ease-standard",
        /* The columns that are not the answer step back. Not hidden and not
           disabled — a drag can still change its mind — just quiet enough that
           the live one is the thing on screen. */
        dragging && !isDropTarget && "opacity-60",
      )}
    >
      <h3 id={headingId} className="flex items-center gap-1.5 px-0.5">
        <StatusDot status={status} />
        <span className="text-xs font-semibold text-text">
          {STATUS_LABEL[status]}
        </span>
        <span className="text-2xs tabular-nums text-text-subtle">
          {projects.length}
        </span>
      </h3>

      <div
        ref={ref}
        className={cn(
          /* `flex-1` absorbs the column's stretched height, so the track — the
             droppable — is the full height of the rail rather than only as
             tall as its cards. Dropping into the empty space below the last
             card therefore works, which is where people aim. */
          "relative flex-1",
          TRACK,
          isDropTarget && STATUS_BAR[status],
          isDropTarget && "border-dashed shadow-raised",
        )}
      >
        {projects.length === 0 && (
          /* `absolute`, so it occupies no space at all. Unmounting it — or
             letting it take height — would resize the track the instant a card
             arrived, which is the loop `min-h-28` above exists to break. It
             fades instead. */
          <p
            className={cn(
              "pointer-events-none absolute inset-1 grid place-items-center rounded-md border border-dashed text-center text-xs transition-opacity duration-100 ease-standard",
              isDropTarget
                ? "border-transparent text-text-muted opacity-0"
                : "border-border bg-surface-sunken text-text-subtle",
            )}
          >
            Nothing in {STATUS_LABEL[status]}
          </p>
        )}

        {/* NO `gap` HERE — the spacing is `pb-2` INSIDE each `<li>`
            (`sortable-project-card.tsx`), and that is a collision fix rather
            than a styling preference. A gap is a strip where no card is under
            the pointer, so the column's own droppable wins it
            (`CollisionPriority.Low`) and resolves to "end of column", while
            one pixel either side a card wins and resolves to "at this index".
            Dragging across a column alternated between the two every frame,
            which is what made the cards in it jump. Padding inside the `<li>`
            puts the gap INSIDE the measured box, so the cards tile
            continuously and the column is the target only below the last one,
            which is the case it exists for. */}
        <ul className="flex flex-col">
          {projects.map((project, index) => (
            <SortableProjectCard
              key={project.id}
              project={project}
              index={index}
              canMove={canMove(project)}
            />
          ))}
        </ul>
      </div>

      <NewProjectTrigger
        label={`New project in ${STATUS_LABEL[status]}, which has ${plural(projects.length, "project", "projects")}`}
        scope={scope}
        status={status}
      />
    </section>
  );
}
