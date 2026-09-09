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
 * SO THE GRIP IS NOW KEYBOARD-ONLY, and never appears on hover. It was drawn
 * for the pointer too, which was worse than redundant: it advertised itself as
 * THE place to grab, and for a while it genuinely was the only one that worked
 * (`project-board-card.tsx` has that story). A mouse can grab the card
 * anywhere, so a widget saying "grab here" is a smaller target and a lie.
 * `group-focus-within` is what still reveals it, so tabbing to a card still
 * surfaces the control that starts a keyboard drag — and `sr-only` would not
 * do: a focused control has to be visible to be usable.
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
/* `pointer-events-none` while invisible, so the one region of the card the
   stretched link does not cover cannot swallow a pointer press either — the
   grip is out of the mouse's way entirely until a keyboard brings it back. */
const HANDLE =
  "pointer-events-none absolute top-1 right-1 z-10 grid size-5 cursor-grab place-items-center rounded-xs border border-border bg-surface text-text-subtle opacity-0 transition-opacity duration-100 ease-standard hover:bg-surface-hover hover:text-text active:cursor-grabbing group-focus-within:pointer-events-auto group-focus-within:opacity-100 focus-visible:pointer-events-auto focus-visible:opacity-100";

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
      /* BELT AND BRACES WITH `draggable={false}` ON THE CARD'S LINK, and the
         pair covers both orderings the browser can choose. Chromium fires
         `pointercancel` when it commits to a native drag; whether that lands
         before or after `dragstart` decides whether cancelling the drag here
         is early enough to save dnd-kit's activation. `draggable={false}`
         means the native drag is never considered, this means it is refused if
         it ever is, and neither costs anything if the other did the job. */
      onDragStart={(event) => event.preventDefault()}
      /* `pb-2` is the gap between cards, held inside the measured box on
         purpose — `project-board-column.tsx` explains what a real `gap` did to
         the collision. */
      className={cn("group relative pb-2", isDragging && "z-20")}
    >
      {/* The lift. A tilt and the modal shadow on the card being carried, and
          nothing at all on the others — which is what makes it read as picked
          up rather than as merely highlighted. */}
      <div
        className={cn(
          "rounded-md transition-[transform,box-shadow,opacity] duration-100 ease-standard",
          /* `select-none` for the same reason the link is not draggable: a
             press-and-move that lands on the project's name would otherwise
             start a text selection, which drags a highlight across the board
             underneath the card being carried. */
          canMove && "cursor-grab select-none active:cursor-grabbing",
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
