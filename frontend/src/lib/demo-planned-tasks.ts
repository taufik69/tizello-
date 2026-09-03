import { DEMO_PEOPLE } from "@/lib/demo-people";
import { BACKLOG_LABELS, type BacklogTask } from "@/types/backlog";

const [DESIGN, FRONTEND, API, CONTENT, A11Y, BUG] = BACKLOG_LABELS;

/*
 * ALREADY PLANNED INTO SPR-14 — the four tasks the sprint planning screen opens
 * with on its right-hand side. They are NOT backlog, so `getProjectBacklog`
 * filters them out and the backlog screen never shows them; only planning,
 * which needs both containers, asks for everything.
 *
 * This is the same fixture as `demo-backlog.ts`, split across two files for the
 * 150-line cap and joined back into one array there. It is not a parallel list:
 * `sprintId` is still the only thing that decides which container a task is in.
 *
 * Four items, 8 + 5 + 3 + 2 = 18 points, which is exactly what SPR-14's
 * roll-ups in `demo-sprints.ts` claim. If one moves, both move. TIZ-29 is
 * unclaimed, so the planned side has a dashed avatar in it too, and TIZ-28 has
 * no description — a bug filed from a one-line report.
 */
export const PLANNED_TASKS: BacklogTask[] = [
  {
    id: "TIZ-26",
    title: "Pricing table, rebuilt against the new tier structure",
    description:
      "Four tiers instead of three, and the comparison table has to stay readable at 360px.",
    priority: "HIGH",
    storyPoints: 8,
    assignee: DEMO_PEOPLE.priya,
    labels: [DESIGN, FRONTEND],
    sprintId: "SPR-14",
  },
  {
    id: "TIZ-27",
    title: "Reindex on the publish hook",
    description: "Drops the ten-minute stale window the cron leaves behind.",
    priority: "HIGH",
    storyPoints: 5,
    assignee: DEMO_PEOPLE.tavi,
    labels: [API],
    sprintId: "SPR-14",
  },
  {
    id: "TIZ-28",
    title: "Date picker traps the keyboard on the last cell",
    priority: "MEDIUM",
    storyPoints: 3,
    assignee: DEMO_PEOPLE.jonah,
    labels: [BUG, A11Y],
    sprintId: "SPR-14",
  },
  {
    id: "TIZ-29",
    title: "Alt text pass over the case-study images",
    priority: "LOW",
    storyPoints: 2,
    labels: [CONTENT, A11Y],
    sprintId: "SPR-14",
  },
];
