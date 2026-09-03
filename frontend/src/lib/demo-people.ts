import type { ProjectPerson } from "@/types/project";

/*
 * The five people the task fixtures put on work.
 *
 * They live in their own module because two fixtures now need the same names —
 * `demo-backlog.ts` and `demo-planned-tasks.ts`, which are the two halves of
 * one project's task list — and a second copy of "Marisol Okonkwo-Vandenberg"
 * is a typo waiting to make the roster and the backlog disagree about who is
 * who.
 *
 * Every name is invented and no address appears at all. The ids match
 * `demo-members.ts`, where `u-me` is the signed-in user.
 */
export const DEMO_PEOPLE = {
  wren: { id: "u-me", name: "Wren Adisa" },
  marisol: { id: "u-marisol", name: "Marisol Okonkwo-Vandenberg" },
  tavi: { id: "u-tavi", name: "Tavi" },
  jonah: { id: "u-jonah", name: "Jonah Ferreira" },
  priya: { id: "u-priya", name: "Priya Raghunathan" },
} as const satisfies Record<string, ProjectPerson>;
