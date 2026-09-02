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

/** Drives the tint of a column's status pill. Defaults to "neutral". */
export type ListTone = "neutral" | "info" | "warning" | "success";

export type BoardList = {
  id: string;
  title: string;
  tone?: ListTone;
  cards: Card[];
};

export type Board = {
  id: string;
  title: string;
  lists: BoardList[];
};
