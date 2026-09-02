import type { Board, Card, LabelColor } from "@/types/board";

/*
 * In-memory stand-in for the database. Module state, so edits survive
 * navigation within a dev session but reset on restart — enough to exercise
 * the read/mutate path end to end. Swap the four functions below for real
 * queries; nothing outside this file knows where the data comes from.
 */

let nextId = 100;
const newId = (prefix: string) => `${prefix}-${nextId++}`;

function card(
  title: string,
  labels: LabelColor[],
  extra: Partial<Card> = {},
): Card {
  return { id: newId("card"), title, labels, members: [], ...extra };
}

const ALEX = { id: "u-1", name: "Alex Rahman" };
const PRIYA = { id: "u-2", name: "Priya Das" };
const SAM = { id: "u-3", name: "Sam Okafor" };

const boards: Board[] = [
  {
    id: "sprint",
    title: "Sprint board",
    lists: [
      {
        id: "list-backlog",
        title: "Backlog",
        cards: [
          card("Audit empty states across the app", ["purple"], {
            members: [PRIYA],
            checklist: { done: 1, total: 6 },
          }),
          card("Decide on a drag-and-drop library", ["blue"], {
            commentCount: 4,
          }),
          card("Write the card detail spec", []),
          card("Keyboard shortcuts for list navigation", ["blue"], {
            members: [SAM],
          }),
        ],
      },
      {
        id: "list-progress",
        title: "In progress",
        cards: [
          card("Board page — lists and cards", ["green", "blue"], {
            members: [ALEX, PRIYA],
            dueDate: "2026-09-05",
            checklist: { done: 4, total: 5 },
            commentCount: 2,
            coverSrc: "/covers/board.svg",
          }),
          card("Card composer with optimistic insert", ["green"], {
            members: [ALEX],
            attachmentCount: 1,
          }),
        ],
      },
      {
        id: "list-review",
        title: "In review",
        cards: [
          card("Dark mode token audit", ["orange"], {
            members: [SAM],
            dueDate: "2026-09-01",
            checklist: { done: 8, total: 8 },
          }),
          card("Fix focus ring on the list composer", ["red"], {
            commentCount: 1,
          }),
        ],
      },
      {
        id: "list-done",
        title: "Done",
        cards: [
          card("Extract Trello design tokens", ["green"], { members: [ALEX] }),
          card("Light and dark theming", ["green"], { members: [PRIYA] }),
          card("Set up Next.js, TypeScript, Tailwind", ["green"]),
        ],
      },
    ],
  },
];

/** Simulates the latency of a real query so loading.tsx is observable. */
const settle = <T,>(value: T): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(value), 120));

export function getBoard(boardId: string): Promise<Board | undefined> {
  return settle(boards.find((board) => board.id === boardId));
}

export function listBoardIds(): Promise<string[]> {
  return settle(boards.map((board) => board.id));
}

/**
 * Appends a card. Returns the created card, or undefined when the list is
 * unknown — callers decide how to surface that.
 */
export function addCard(
  boardId: string,
  listId: string,
  title: string,
): Promise<Card | undefined> {
  const list = boards
    .find((board) => board.id === boardId)
    ?.lists.find((item) => item.id === listId);

  if (!list) return settle(undefined);

  const created = card(title, []);
  list.cards.push(created);
  return settle(created);
}
