import { DEMO_PEOPLE } from "@/lib/demo-people";
import { getProject } from "@/lib/demo-projects";
import { getProjectSprints } from "@/lib/demo-sprints";
import { settle } from "@/lib/settle";
import { activeSprint } from "@/lib/sprint-groups";
import { BACKLOG_LABELS } from "@/types/backlog";
import type { ProjectPerson, ProjectRecord } from "@/types/project";
import type { SprintRecord } from "@/types/sprint";
import type { SprintBoardTask } from "@/types/sprint-board";

/*
 * THE ACTIVE SPRINT'S TASKS — the eight cards on the sprint board, and nothing
 * else. Per `.claude/rules/workflow.md` the board is not the backlog: the
 * twelve uncommitted tasks in `demo-backlog.ts` and the four planned into
 * SPR-14 are deliberately absent, because they are in the other container.
 *
 * The people and the labels are imported rather than re-declared — the roster,
 * the backlog, planning and this board all agree about who is who and what a
 * tag is called. Only the two board-only fields are new: `status`, which IS the
 * column, and `position`, the float rank inside it.
 *
 * The roll-ups match SPR-13 in `demo-sprints.ts` exactly — 8 items, 29 points,
 * 3 done — so the sprints card and the board cannot disagree. If one moves,
 * both move.
 *
 * The spread is deliberate. TIZ-32 carries the longest title a card should
 * tolerate and TIZ-36 the most labels; TIZ-31 and TIZ-37 are unclaimed; TIZ-37
 * is unestimated, untagged and has no description either — the emptiest a card
 * can be. Ids continue the `TIZ-*` sequence past `demo-backlog.ts` so no two
 * screens show the same key on different work.
 */
const [DESIGN, FRONTEND, API, CONTENT, A11Y, BUG] = BACKLOG_LABELS;

/* 1024 apart, so a drop between two neighbours has room to halve the gap
   thousands of times before the float would need a renumber. */
const TASKS: SprintBoardTask[] = [
  {
    id: "TIZ-30",
    title: "Mega-menu on desktop, two levels deep",
    description:
      "Three top-level sections, each opening a panel. Hover to open, click to pin, and Escape closes it back to the trigger.",
    priority: "HIGH",
    storyPoints: 8,
    assignee: DEMO_PEOPLE.marisol,
    labels: [DESIGN, FRONTEND],
    sprintId: "SPR-13",
    status: "todo",
    position: 1024,
  },
  {
    id: "TIZ-31",
    title: "Full-screen nav drawer under 768px",
    description: "Same three sections, stacked, with the account block pinned to the bottom.",
    priority: "MEDIUM",
    storyPoints: 5,
    labels: [FRONTEND],
    sprintId: "SPR-13",
    status: "todo",
    position: 2048,
  },
  {
    id: "TIZ-37",
    title: "Decide what happens to the old /docs redirects",
    priority: "LOW",
    labels: [],
    sprintId: "SPR-13",
    status: "todo",
    position: 3072,
  },
  {
    id: "TIZ-32",
    title:
      "Keyboard model for the whole nav — roving tabindex across the sections, Escape back to the trigger, and focus restored on close",
    description:
      "The mega-menu, the drawer and the account menu all need the same one. Written once, applied three times.",
    priority: "HIGH",
    storyPoints: 5,
    assignee: DEMO_PEOPLE.wren,
    labels: [FRONTEND, A11Y],
    sprintId: "SPR-13",
    status: "in-progress",
    position: 1024,
  },
  {
    id: "TIZ-33",
    title: "Nav flag leaks into the marketing footer",
    priority: "MEDIUM",
    storyPoints: 3,
    assignee: DEMO_PEOPLE.jonah,
    labels: [BUG],
    sprintId: "SPR-13",
    status: "in-progress",
    position: 2048,
  },
  {
    id: "TIZ-34",
    title: "Section endpoint returns the tree in one call",
    description: "Three round trips became one. The shape is nested, not flat.",
    priority: "MEDIUM",
    storyPoints: 3,
    assignee: DEMO_PEOPLE.priya,
    labels: [API],
    sprintId: "SPR-13",
    status: "done",
    position: 1024,
  },
  {
    id: "TIZ-35",
    title: "Rewrite the section blurbs",
    priority: "LOW",
    storyPoints: 2,
    assignee: DEMO_PEOPLE.tavi,
    labels: [CONTENT],
    sprintId: "SPR-13",
    status: "done",
    position: 2048,
  },
  {
    id: "TIZ-36",
    title: "Skip link lands on the first section, not the logo",
    description: "It was skipping to the header, which is the thing being skipped.",
    priority: "HIGH",
    storyPoints: 3,
    assignee: DEMO_PEOPLE.wren,
    labels: [A11Y, DESIGN, FRONTEND],
    sprintId: "SPR-13",
    status: "done",
    position: 3072,
  },
];

/*
 * The board route is not scoped to a project yet — see the Projects entry in
 * CLAUDE.md — so the board resolves to the one project the other fixtures
 * describe rather than reading an id out of the URL.
 */
const BOARD_PROJECT_ID = "TIZ-1";

/**
 * The ids that open the sprint board. `sprint` is the one the sidebar links to;
 * the rest are the sprint's own keys, plus `sprint-4` because that is the URL
 * this route answered before the board was built.
 */
const SPRINT_BOARD_IDS = ["sprint", "sprint-13", "spr-13", "sprint-4"];

export type SprintBoardData = {
  project: ProjectRecord;
  sprint: SprintRecord;
  tasks: SprintBoardTask[];
};

/**
 * One sprint board. `undefined` is the signal for `notFound()` — or, on this
 * route, for falling through to the backlog board.
 *
 * ONLY THE ACTIVE SPRINT HAS A BOARD. A sprint still being planned has no
 * columns to render and a completed one is history, so both resolve to nothing
 * rather than to an empty board.
 */
export async function getSprintBoard(
  boardId: string,
): Promise<SprintBoardData | undefined> {
  if (!SPRINT_BOARD_IDS.includes(boardId.toLowerCase())) return undefined;

  const [project, sprints] = await Promise.all([
    getProject(BOARD_PROJECT_ID),
    getProjectSprints(BOARD_PROJECT_ID),
  ]);
  const sprint = activeSprint(sprints);
  if (!project || !sprint) return undefined;

  /* Shallow copies, so a board holding the list in `useState` cannot write a
     drag through to the module-level fixture and leak it into the next route. */
  return { project, sprint, tasks: TASKS.map((task) => ({ ...task })) };
}

/** Everyone who can be put on a card — the assignee picker's options. */
export function getBoardAssignees(): Promise<ProjectPerson[]> {
  return settle(Object.values(DEMO_PEOPLE).slice());
}
