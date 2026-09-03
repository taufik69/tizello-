import { settle } from "@/lib/settle";
import type { ProjectPerson } from "@/types/project";
import { BACKLOG_LABELS, type BacklogTask } from "@/types/backlog";

/*
 * In-memory stand-in for the backlog API, shaped like `demo-projects.ts`: a
 * module-level array, the same latency shim, and getter signatures matching
 * the eventual endpoints (`GET /projects/:id/backlog`) so swapping the bodies
 * for real queries is the whole migration.
 *
 * Every name here is invented and no address appears at all. The people reuse
 * the ids from `demo-members.ts` — `u-me` is the signed-in user in all three
 * fixtures — so the roster, the projects table and this list agree about who
 * is who.
 *
 * The task ids start at TIZ-14 on purpose: `demo-projects.ts` already spends
 * TIZ-1…TIZ-6 on PROJECT keys, and overlapping the two would make a screenshot
 * ambiguous. A real tracker draws both from one sequence.
 */

const PEOPLE = {
  wren: { id: "u-me", name: "Wren Adisa" },
  marisol: { id: "u-marisol", name: "Marisol Okonkwo-Vandenberg" },
  tavi: { id: "u-tavi", name: "Tavi" },
  jonah: { id: "u-jonah", name: "Jonah Ferreira" },
  priya: { id: "u-priya", name: "Priya Raghunathan" },
} as const satisfies Record<string, ProjectPerson>;

const [DESIGN, FRONTEND, API, CONTENT, A11Y, BUG] = BACKLOG_LABELS;

/*
 * Twelve tasks, one backlog, returned for whichever project is open — the same
 * shortcut `demo-members.ts` takes, and for the same reason: the screen is the
 * point, not the seeding.
 *
 * The spread is deliberate. Four HIGH / five MEDIUM / three LOW, so no group
 * header renders a count of one and none of them is empty. TIZ-16 carries the
 * longest title the row should tolerate; TIZ-17 has no assignee, no estimate
 * and no labels at all; TIZ-20 and TIZ-24 are unclaimed; TIZ-21 and TIZ-25 are
 * unestimated. Every one of those is a cell that has to render a dash rather
 * than an empty box.
 *
 * `sprintId` is null on all of them — that is what makes them backlog.
 */
const tasks: BacklogTask[] = [
  {
    id: "TIZ-14",
    title: "Rebuild the marketing nav against the new IA",
    description:
      "Three top-level sections instead of seven, a mega-menu on desktop and a full-screen drawer under 768px. Blocked on the IA sign-off.",
    priority: "HIGH",
    storyPoints: 5,
    assignee: PEOPLE.wren,
    labels: [DESIGN, FRONTEND],
    sprintId: null,
  },
  {
    id: "TIZ-15",
    title: "Focus escapes the pricing dialog on Safari 17",
    description:
      "Tab reaches the page behind the modal. Reproducible on iOS too, so it is not the desktop shim.",
    priority: "HIGH",
    storyPoints: 3,
    assignee: PEOPLE.jonah,
    labels: [BUG, A11Y],
    sprintId: null,
  },
  {
    /* The longest title the UI should tolerate: it has to wrap to two lines on
       a narrow row and never push the badges off the right edge. */
    id: "TIZ-16",
    title:
      "Content migration off the legacy CMS — export, redirect map, image re-hosting and a dry-run report",
    description:
      "One script, run twice: once in report mode against staging, once for real during the freeze.",
    priority: "HIGH",
    storyPoints: 13,
    assignee: PEOPLE.marisol,
    labels: [CONTENT, API],
    sprintId: null,
  },
  {
    /* The emptiest a row can be: unassigned, unestimated, untagged, and no
       description behind it either. */
    id: "TIZ-17",
    title: "Decide on the hero video codec",
    priority: "HIGH",
    labels: [],
    sprintId: null,
  },
  {
    id: "TIZ-18",
    title: "Component library: buttons, inputs and dialogs",
    description:
      "The three primitives every template needs. Tokens are already agreed, so this is assembly rather than design.",
    priority: "MEDIUM",
    storyPoints: 8,
    assignee: PEOPLE.priya,
    labels: [DESIGN, FRONTEND],
    sprintId: null,
  },
  {
    id: "TIZ-19",
    title: "Search returns stale results for ten minutes after a publish",
    description: "The index is warmed on a cron rather than on the publish hook.",
    priority: "MEDIUM",
    storyPoints: 5,
    assignee: PEOPLE.tavi,
    labels: [API, BUG],
    sprintId: null,
  },
  {
    id: "TIZ-20",
    title: "Add a skip-to-content link to every template",
    priority: "MEDIUM",
    storyPoints: 2,
    labels: [A11Y],
    sprintId: null,
  },
  {
    id: "TIZ-21",
    title: "Write the 404 and 500 page copy",
    description: "Short, no jokes, and a route back to something useful.",
    priority: "MEDIUM",
    assignee: PEOPLE.marisol,
    labels: [CONTENT],
    sprintId: null,
  },
  {
    id: "TIZ-22",
    title: "Audit colour contrast across the dark theme",
    priority: "MEDIUM",
    storyPoints: 3,
    assignee: PEOPLE.wren,
    labels: [A11Y, DESIGN],
    sprintId: null,
  },
  {
    id: "TIZ-23",
    title: "Retire the old sitemap generator",
    priority: "LOW",
    storyPoints: 1,
    assignee: PEOPLE.jonah,
    labels: [API],
    sprintId: null,
  },
  {
    id: "TIZ-24",
    title: "Parallax on the case-study header",
    description: "Nice to have. Drop it if the sprint is tight.",
    priority: "LOW",
    storyPoints: 2,
    labels: [DESIGN],
    sprintId: null,
  },
  {
    id: "TIZ-25",
    title: "Document the deploy preview workflow",
    priority: "LOW",
    assignee: PEOPLE.tavi,
    labels: [CONTENT],
    sprintId: null,
  },
];

export function getProjectBacklog(projectId: string): Promise<BacklogTask[]> {
  /* The one backlog stands in for every project, so the id only guards the
     empty case here. The real query filters on it. */
  return settle(projectId ? tasks : []);
}

/** Everyone who can be put on a task — the assignee picker's options. */
export function getBacklogAssignees(
  workspaceId: string,
): Promise<ProjectPerson[]> {
  return settle(workspaceId ? Object.values(PEOPLE).slice() : []);
}
