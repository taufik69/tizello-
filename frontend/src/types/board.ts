export const LABEL_COLORS = [
  "green",
  "yellow",
  "orange",
  "red",
  "purple",
  "blue",
] as const;

export type LabelColor = (typeof LABEL_COLORS)[number];

export type Member = {
  id: string;
  name: string;
};

export type Card = {
  id: string;
  title: string;
  labels: LabelColor[];
  members: Member[];
  /** ISO date. Absent means no due date. */
  dueDate?: string;
  checklist?: { done: number; total: number };
  commentCount?: number;
  attachmentCount?: number;
  /** Path under /public. Rendered above the card title. */
  coverSrc?: string;
};

/**
 * The three fixed sprint statuses. A card's list IS its status — there is no
 * separate status field that could disagree with where the card sits.
 */
export const SPRINT_STATUSES = ["todo", "in-progress", "done"] as const;
export type SprintStatus = (typeof SPRINT_STATUSES)[number];

/** Drives the tint of a column's status pill. */
export type ListTone = "neutral" | "info" | "warning" | "success";

export type BoardList = {
  id: string;
  title: string;
  tone?: ListTone;
  /** Present on sprint boards only; a backlog has a single untyped list. */
  status?: SprintStatus;
  cards: Card[];
};

/**
 * Two containers, not one board. A task is in exactly one of them: planning
 * moves it backlog -> sprint, close returns whatever is unfinished.
 * See .claude/rules/workflow.md.
 */
export type BoardKind = "backlog" | "sprint";

export type Sprint = {
  /** Monotonic, human-facing: "Sprint 4". */
  number: number;
  /** ISO dates. */
  startsOn: string;
  endsOn: string;
  /** Set when the sprint is closed; until then the sprint is active. */
  closedOn?: string;
};

export type Board = {
  id: string;
  title: string;
  kind: BoardKind;
  /** Set on sprint boards only. */
  sprint?: Sprint;
  lists: BoardList[];
};

export type SprintBoard = Board & { kind: "sprint"; sprint: Sprint };
export type BacklogBoard = Board & { kind: "backlog" };

export function isSprintBoard(board: Board): board is SprintBoard {
  return board.kind === "sprint" && board.sprint !== undefined;
}
