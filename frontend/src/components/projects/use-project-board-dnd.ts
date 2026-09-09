"use client";

import { useCallback, useRef, useState, type RefObject } from "react";
import {
  cardOffsets,
  resolveTarget,
  type BoardSnapshot,
  type CardBox,
  type ColumnBox,
  type DragTarget,
} from "@/lib/board-drag";
import { PROJECT_STATUSES } from "@/types/project";

/**
 * The pointer half of the projects board's own drag and drop.
 *
 * `lib/board-drag.ts` holds the arithmetic and says why this is hand-rolled
 * rather than @dnd-kit. This file is the part that has to touch the DOM: it
 * measures the board at the press, listens on the document until the release,
 * and writes the lifted card's transform.
 *
 * THE LIFTED CARD IS MOVED IMPERATIVELY, NOT THROUGH STATE, and that is the
 * one deliberate break from "React owns the DOM". It has to follow the pointer
 * at frame rate; routing that through `setState` would re-render six columns
 * of cards sixty times a second to move one element. So React state holds only
 * the TARGET — which changes a handful of times in a whole drag — and the
 * element's `style.transform` is written straight onto the node. Nothing else
 * reads that transform, and it is cleared on release.
 *
 * MEASURING IS BY `data-` ATTRIBUTE rather than by a ref per card. Six columns
 * of cards would otherwise mean threading a ref callback through two
 * components to build a registry that the DOM already is — and the DOM is the
 * thing being measured, so querying it is not an indirection.
 *
 * THE 8px THRESHOLD IS WHAT KEEPS A CARD CLICKABLE: its name is a stretched
 * link over the whole surface, so without a distance to travel first, every
 * click would be a one-pixel drag and the project would never open.
 */
const THRESHOLD = 8;

/** The lifted card's look while it is being carried. Cleared on release. */
const LIFT = "rotate(2deg)";

type Session = {
  id: string;
  element: HTMLElement;
  originX: number;
  originY: number;
  snapshot: BoardSnapshot;
  started: boolean;
};

export type BoardDrag = {
  id: string;
  target: DragTarget;
  /** `translateY` per card id — the cards sliding out of the way. */
  offsets: Map<string, number>;
};

function measureCards(list: Element): CardBox[] {
  return [...list.querySelectorAll<HTMLElement>("[data-card]")].map((element) => {
    const rect = element.getBoundingClientRect();
    return { id: element.dataset.card ?? "", top: rect.top, height: rect.height };
  });
}

function measureBoard(rail: HTMLElement): BoardSnapshot {
  const columns: ColumnBox[] = [];

  for (const status of PROJECT_STATUSES) {
    const section = rail.querySelector<HTMLElement>(`[data-column="${status}"]`);
    const list = section?.querySelector<HTMLElement>("[data-cards]");
    if (!section || !list) continue;

    const box = section.getBoundingClientRect();
    columns.push({
      status,
      left: box.left,
      right: box.right,
      top: list.getBoundingClientRect().top,
      cards: measureCards(list),
    });
  }

  return { columns };
}

export function useProjectBoardDnd({
  railRef,
  onDrop,
}: {
  railRef: RefObject<HTMLElement | null>;
  /** Fired once, on release, with where the card actually landed. */
  onDrop: (id: string, target: DragTarget) => void;
}) {
  const [drag, setDrag] = useState<BoardDrag | null>(null);
  const session = useRef<Session | null>(null);

  const release = useCallback(() => {
    const current = session.current;
    session.current = null;

    if (current) {
      current.element.style.transform = "";
      current.element.style.transition = "";
    }

    return current;
  }, []);

  const onPointerDown = useCallback(
    (event: React.PointerEvent<HTMLElement>, id: string) => {
      const rail = railRef.current;
      /* Primary button only — middle-click is the browser's autoscroll and
         right-click is the context menu; hijacking either is hostile. */
      if (!rail || session.current || event.button !== 0 || !event.isPrimary) return;
      if ((event.target as Element).closest("[data-no-drag]")) return;

      session.current = {
        id,
        element: event.currentTarget,
        originX: event.clientX,
        originY: event.clientY,
        snapshot: measureBoard(rail),
        started: false,
      };

      function onMove(move: PointerEvent) {
        const current = session.current;
        if (!current) return;

        const dx = move.clientX - current.originX;
        const dy = move.clientY - current.originY;

        if (!current.started) {
          if (Math.hypot(dx, dy) < THRESHOLD) return;
          current.started = true;
          /* No transition on the carried card: it tracks the pointer 1:1, and
             a tween here would make it lag behind the cursor. */
          current.element.style.transition = "none";
        }

        current.element.style.transform = `translate3d(${dx}px, ${dy}px, 0) ${LIFT}`;

        const target = resolveTarget(current.snapshot, current.id, {
          x: move.clientX,
          y: move.clientY,
        });
        if (!target) return;

        setDrag((previous) =>
          /* Same answer as last frame — hand back the identical object so React
             bails out of the render entirely. */
          previous &&
          previous.target.status === target.status &&
          previous.target.index === target.index
            ? previous
            : {
                id: current.id,
                target,
                offsets: cardOffsets(current.snapshot, current.id, target),
              },
        );
      }

      function onUp(up: PointerEvent) {
        document.removeEventListener("pointermove", onMove);
        document.removeEventListener("pointerup", onUp);
        document.removeEventListener("pointercancel", onCancel);
        window.removeEventListener("keydown", onKeyDown, true);

        const current = release();
        setDrag(null);

        if (!current?.started) return;

        const target = resolveTarget(current.snapshot, current.id, {
          x: up.clientX,
          y: up.clientY,
        });
        if (target) onDrop(current.id, target);
      }

      function onCancel() {
        document.removeEventListener("pointermove", onMove);
        document.removeEventListener("pointerup", onUp);
        document.removeEventListener("pointercancel", onCancel);
        window.removeEventListener("keydown", onKeyDown, true);
        release();
        setDrag(null);
      }

      /* Escape abandons the drag and commits nothing. Capture, and stopped, so
         it does not also reach a drawer or menu behind the board. */
      function onKeyDown(key: KeyboardEvent) {
        if (key.key !== "Escape") return;
        key.stopPropagation();
        onCancel();
      }

      document.addEventListener("pointermove", onMove);
      document.addEventListener("pointerup", onUp);
      document.addEventListener("pointercancel", onCancel);
      window.addEventListener("keydown", onKeyDown, true);
    },
    [railRef, onDrop, release],
  );

  return { drag, onPointerDown };
}
