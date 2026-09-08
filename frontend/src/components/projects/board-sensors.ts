"use client";

import { PointerActivationConstraints } from "@dnd-kit/dom";
import { KeyboardSensor, PointerSensor } from "@dnd-kit/react";

/*
 * How a drag starts on the projects board.
 *
 * THE WHOLE CARD IS THE POINTER HANDLE. `useSortable`'s `handle` narrows
 * activation to one element for EVERY sensor, which is right for the keyboard
 * — the grip button is the only focusable thing on a card that is not the
 * link — and wrong for the pointer, where "grab it anywhere" is the gesture
 * people expect from a kanban card. `activatorElements` overrides that for the
 * pointer alone: it returns the card itself, so a press anywhere on it counts,
 * while the keyboard sensor still starts from the grip.
 *
 * THE 8px THRESHOLD IS WHAT KEEPS THE CARD CLICKABLE. A board card carries a
 * stretched link over its whole surface; without a distance constraint every
 * click would be a one-pixel drag and the project would never open. Eight is
 * far enough to be deliberate and short enough not to feel sticky.
 *
 * Built once at module scope. These are plugin descriptors, not React values —
 * rebuilding them per render would hand `DragDropProvider` a new sensor list
 * on every keystroke elsewhere on the page.
 */
export const BOARD_SENSORS = [
  PointerSensor.configure({
    /* An ARRAY of constraint instances, not an options object — the sensor
       runs them in order and the first to activate wins. */
    activationConstraints: [new PointerActivationConstraints.Distance({ value: 8 })],
    activatorElements: (source) => [source.element],
  }),
  KeyboardSensor,
];
