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

export type BoardList = {
  id: string;
  title: string;
  cards: Card[];
};

export type Board = {
  id: string;
  title: string;
  lists: BoardList[];
};
