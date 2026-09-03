import { settle } from "@/lib/settle";
import type { Board, Card, LabelColor, SprintStatus } from "@/types/board";

/*
 * In-memory stand-in for the database. Module state, so edits survive
 * navigation within a dev session but reset on restart — enough to exercise
 * the read/mutate path end to end. Swap the functions below for real queries;
 * nothing outside this file knows where the data comes from.
 *
 * Shape follows .claude/rules/workflow.md: a backlog and a sprint board are
 * separate containers, and a card lives in exactly one of them.
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

const SPRINT_LIST_META: Record<
  SprintStatus,
  { id: string; title: string; tone: "neutral" | "info" | "success" }
> = {
  todo: { id: "list-todo", title: "To do", tone: "neutral" },
  "in-progress": { id: "list-in-progress", title: "In progress", tone: "info" },
  done: { id: "list-done", title: "Done", tone: "success" },
};

const boards: Board[] = [
  {
    id: "backlog",
    title: "Backlog",
    kind: "backlog",
    lists: [
      {
        id: "list-backlog",
        title: "Backlog",
        tone: "neutral",
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
          card("Card detail drawer", ["purple"], { commentCount: 2 }),
          card("Board settings and archive", []),
        ],
      },
    ],
  },
  {
    id: "sprint-4",
    title: "Sprint 4",
    kind: "sprint",
    sprint: { number: 4, startsOn: "2026-09-01", endsOn: "2026-09-12" },
    lists: [
      {
        ...SPRINT_LIST_META.todo,
        status: "todo",
        cards: [
          card("Fix focus ring on the list composer", ["red"], {
            commentCount: 1,
          }),
          card("Sprint close: return unfinished work", ["purple"], {
            members: [SAM],
          }),
        ],
      },
      {
        ...SPRINT_LIST_META["in-progress"],
        status: "in-progress",
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
          card("Dark mode token audit", ["orange"], {
            members: [SAM],
            dueDate: "2026-09-01",
            checklist: { done: 8, total: 8 },
          }),
        ],
      },
      {
        ...SPRINT_LIST_META.done,
        status: "done",
        cards: [
          card("Extract Trello design tokens", ["green"], { members: [ALEX] }),
          card("Light and dark theming", ["green"], { members: [PRIYA] }),
          card("Set up Next.js, TypeScript, Tailwind", ["green"]),
        ],
      },
    ],
  },
];

export function getBoard(boardId: string): Promise<Board | undefined> {
  return settle(boards.find((board) => board.id === boardId));
}

export function listBoardIds(): Promise<string[]> {
  return settle(boards.map((board) => board.id));
}

/** The single active (unclosed) sprint, if there is one. */
export function getActiveSprint(): Promise<Board | undefined> {
  return settle(
    boards.find((board) => board.kind === "sprint" && !board.sprint?.closedOn),
  );
}

export function getBacklog(): Promise<Board | undefined> {
  return settle(boards.find((board) => board.kind === "backlog"));
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

export function findBoard(kind: Board["kind"], id?: string) {
  return id
    ? boards.find((board) => board.id === id && board.kind === kind)
    : boards.find((board) => board.kind === kind);
}

export { settle };
