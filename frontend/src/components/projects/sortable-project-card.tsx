"use client";

import { useSortable } from "@dnd-kit/react/sortable";
import { ProjectBoardCard } from "@/components/projects/project-board-card";
import { GripIcon } from "@/components/ui/icons";
import { cn } from "@/lib/cn";
import { PROJECT_STATUS_LABEL, type ProjectRecord } from "@/types/project";

/*
 * A board card that sorts, and a board card that opens its project.
 *
 * `useSortable` rather than a plain draggable, and that IS the upgrade: every
 * other card in range slides out of the way as this one passes over them, so
 * the board previews the arrangement instead of describing it. There is no
 * phantom placeholder to draw any more — the real cards are the preview.
 *
 * `group` is the status, which is what makes a card sortable ACROSS columns
 * and not just within one; `index` is its rank in that column's id list. Both
 * come from the map `ProjectBoard` controls.
 *
 * THE WHOLE CARD IS THE POINTER HANDLE. `handleRef` still marks the grip, but
 * only the KEYBOARD is bound by it — `board-sensors.ts` widens the pointer's
 * activator back out to the card itself. The grip exists because the card's
 * name carries a stretched link: from the keyboard, Enter on the card
 * navigates, so a card that was its own activator would have no key left to
 * open with.
 *
 * NOTHING HERE TRANSFORMS OR TRANSITIONS THE MEASURED ELEMENT. dnd-kit
 * translates the `<li>` itself and runs its own 300ms sort transition on it; a
 * competing `transition-[transform]` from a utility class smears every frame
 * of that against a second timing function. The lift therefore sits on an
 * inner wrapper, where a transform changes what is drawn and not the box the
 * library measures.
 *
 * Not sortable at all without write access — a card that lifts and snaps back
 * on a `403` is worse than one that does not lift.
 */
const HANDLE =
  "absolute top-1 right-1 z-10 grid size-5 cursor-grab place-items-center rounded-xs border border-border bg-surface text-text-subtle opacity-0 transition-opacity duration-100 ease-standard hover:bg-surface-hover hover:text-text active:cursor-grabbing group-focus-within:opacity-100 group-hover:opacity-100 focus-visible:opacity-100";

export function SortableProjectCard({
  project,
  index,
  canMove,
}: {
  project: ProjectRecord;
  /** Rank within its column's id list — the sortable's own coordinate. */
  index: number;
  canMove: boolean;
}) {
  const { ref, handleRef, isDragging } = useSortable({
    id: project.id,
    index,
    type: "item",
    accept: "item",
    group: project.status,
    disabled: !canMove,
  });

  return (
    <li
      ref={ref}
      data-dragging={isDragging || undefined}
      className={cn("group relative", isDragging && "z-20")}
    >
      {/* The lift. A tilt and the modal shadow on the card being carried, and
          nothing at all on the others — which is what makes it read as picked
          up rather than as merely highlighted. */}
      <div
        className={cn(
          "rounded-md transition-[transform,box-shadow,opacity] duration-100 ease-standard",
          canMove && "cursor-grab active:cursor-grabbing",
          isDragging && "rotate-2 cursor-grabbing shadow-modal",
        )}
      >
        <ProjectBoardCard project={project} />
      </div>

      {canMove && (
        <button
          type="button"
          ref={handleRef}
          aria-label={`Move ${project.name} out of ${PROJECT_STATUS_LABEL[project.status]}`}
          className={HANDLE}
        >
          <GripIcon className="size-3.5" />
        </button>
      )}
    </li>
  );
}
