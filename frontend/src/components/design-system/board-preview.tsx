import { CardTile } from "@/components/board/card-tile";
import { ColumnPill } from "@/components/board/column-pill";
import type { BoardList } from "@/types/board";
import { Section } from "./section";

/*
 * Fixtures rendered through the REAL CardTile and ColumnPill, so this preview
 * cannot drift from the board at /board/sprint. Change the card there and this
 * section changes with it.
 */
const LISTS: BoardList[] = [
  {
    id: "preview-todo",
    title: "To do",
    tone: "neutral",
    cards: [
      {
        id: "p1",
        title: "Audit empty states across the app",
        labels: ["purple"],
        members: [{ id: "u2", name: "Priya Das" }],
        checklist: { done: 1, total: 6 },
      },
      {
        id: "p2",
        title: "Decide on a drag-and-drop library",
        labels: [],
        members: [],
        commentCount: 4,
      },
    ],
  },
  {
    id: "preview-progress",
    title: "In progress",
    tone: "info",
    cards: [
      {
        id: "p3",
        title: "Notion-style kanban cards",
        labels: ["green", "blue"],
        members: [
          { id: "u1", name: "Alex Rahman" },
          { id: "u2", name: "Priya Das" },
        ],
        dueDate: "2026-09-05",
        checklist: { done: 4, total: 5 },
      },
    ],
  },
  {
    id: "preview-done",
    title: "Done",
    tone: "success",
    cards: [
      {
        id: "p4",
        title: "Extract Trello design tokens",
        labels: ["green"],
        members: [{ id: "u3", name: "Sam Okafor" }],
        checklist: { done: 8, total: 8 },
      },
    ],
  },
];

export function BoardPreview() {
  return (
    <Section title="Board preview — 272px columns, flat cards">
      <div className="scrollbar-board flex gap-4 overflow-x-auto rounded-md border border-border bg-surface p-4">
        {LISTS.map((list) => (
          <div key={list.id} className="w-list shrink-0">
            <div className="flex items-center gap-2 px-1 pb-2">
              <ColumnPill
                id={`preview-${list.id}`}
                title={list.title}
                tone={list.tone}
              />
              <span className="text-2xs text-text-subtle">
                {list.cards.length}
              </span>
            </div>
            <ul className="space-y-1.5">
              {list.cards.map((card) => (
                <CardTile key={card.id} card={card} />
              ))}
            </ul>
          </div>
        ))}
      </div>
      <p className="text-xs text-text-muted">
        Cards are flat: a hairline border and a hover fill, no drop shadow.
        Colour lives in the status pill and the label dots, not the track — a
        dense column stays calm. Rendered with the same{" "}
        <code className="font-mono">CardTile</code> the real board uses.
      </p>
    </Section>
  );
}
