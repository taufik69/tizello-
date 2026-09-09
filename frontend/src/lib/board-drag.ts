import type { ProjectStatus } from "@/types/project";

/*
 * The geometry behind the projects board's drag and drop. Pure arithmetic over
 * a snapshot of measured boxes — no DOM, no React, no library.
 *
 * WHY THIS REPLACED @dnd-kit. The library's sortable is CONTROLLED: it wants a
 * `Record<column, ids>` mutated on every `dragover`, which means the DOM
 * reorders under the pointer while the drag is still going. Every reorder
 * re-measures, and a re-measure can resolve to a different target than the one
 * that caused it — so the cards in the hovered column shuffled, settled, and
 * shuffled again, continuously. Four attempts at damping that loop (widening
 * the activator, stabilising the map's identity, freezing the rail's height,
 * closing the gaps between cards) each removed one feeder and left the loop
 * standing, because the loop is the architecture rather than a bug in it.
 *
 * THE RULE HERE IS THAT NOTHING MOVES IN THE LAYOUT UNTIL THE DROP. Boxes are
 * measured ONCE, at the press. Every frame after that resolves a target
 * against those frozen numbers and expresses the result as `transform` only —
 * which is composited, affects no other element, and cannot change the very
 * measurements the next frame reads. The list reorders exactly once, when the
 * pointer is released. A feedback loop needs feedback; there is none.
 *
 * VARIABLE HEIGHTS ARE WHY THE OFFSETS ARE CUMULATIVE TOPS rather than a count
 * of slots times a card height. A board card's name wraps, so a two-line card
 * is taller than a one-line card and shifting everything by "one card" would
 * leave visible seams. `cardOffsets` lays the column out as it WILL be and
 * returns the difference per card, so each one slides exactly as far as it
 * needs to.
 */

/** One card's frozen box. `height` includes the `pb-2` that spaces it from the next. */
export type CardBox = { id: string; top: number; height: number };

/**
 * One column's frozen box.
 *
 * `top` is where the card list starts, not where the section does — an EMPTY
 * column has no card to borrow a starting offset from, and is exactly the case
 * a drop most needs to resolve.
 */
export type ColumnBox = {
  status: ProjectStatus;
  left: number;
  right: number;
  top: number;
  cards: CardBox[];
};

export type BoardSnapshot = { columns: ColumnBox[] };

/** Where the lifted card would land: a column, and an index into that column WITHOUT it. */
export type DragTarget = { status: ProjectStatus; index: number };

/**
 * The column under the pointer, or the nearest one.
 *
 * Nearest rather than null, because the pointer spends a lot of a real drag in
 * the gaps between columns and off the ends of the rail — and a target that
 * blinks out whenever it does is what makes a board feel like it is refusing
 * the drop.
 */
function columnAt(snapshot: BoardSnapshot, x: number): ColumnBox | null {
  let nearest: ColumnBox | null = null;
  let best = Infinity;

  for (const column of snapshot.columns) {
    if (x >= column.left && x <= column.right) return column;

    const distance = Math.min(Math.abs(x - column.left), Math.abs(x - column.right));
    if (distance < best) {
      best = distance;
      nearest = column;
    }
  }

  return nearest;
}

/** The column's cards with the lifted one taken out — the list an index refers to. */
function without(column: ColumnBox, draggedId: string): CardBox[] {
  return column.cards.filter((card) => card.id !== draggedId);
}

/**
 * Which column and index the pointer is asking for.
 *
 * The index is a count of the cards whose MIDPOINT the pointer has passed,
 * measured against frozen tops. Midpoints rather than edges so the answer
 * flips once, halfway through a card, instead of twice at its boundaries.
 */
export function resolveTarget(
  snapshot: BoardSnapshot,
  draggedId: string,
  pointer: { x: number; y: number },
): DragTarget | null {
  const column = columnAt(snapshot, pointer.x);
  if (!column) return null;

  const rest = without(column, draggedId);
  let index = 0;

  while (index < rest.length && pointer.y > rest[index].top + rest[index].height / 2) {
    index += 1;
  }

  return { status: column.status, index };
}

/**
 * How far each card has to slide, by id — `translateY` in pixels.
 *
 * Only the source and target columns are laid out; every other column is
 * untouched and absent from the map, which is what keeps a drag across a
 * six-column board from writing a transform onto every card on screen.
 */
export function cardOffsets(
  snapshot: BoardSnapshot,
  draggedId: string,
  target: DragTarget,
): Map<string, number> {
  const offsets = new Map<string, number>();
  const dragged = snapshot.columns
    .flatMap((column) => column.cards)
    .find((card) => card.id === draggedId);

  if (!dragged) return offsets;

  const source = snapshot.columns.find((column) =>
    column.cards.some((card) => card.id === draggedId),
  );

  for (const column of snapshot.columns) {
    const isSource = column.status === source?.status;
    const isTarget = column.status === target.status;
    if (!isSource && !isTarget) continue;

    const rest = without(column, draggedId);
    /* The column as it will be: the lifted card slotted in where it is going,
       and simply absent from where it came from. */
    const settled = isTarget
      ? [...rest.slice(0, target.index), dragged, ...rest.slice(target.index)]
      : rest;

    let top = column.top;
    for (const card of settled) {
      const original = column.cards.find((entry) => entry.id === card.id);
      if (original && card.id !== draggedId) offsets.set(card.id, top - original.top);
      top += card.height;
    }
  }

  return offsets;
}
