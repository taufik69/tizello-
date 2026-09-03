import { settle } from "@/lib/settle";
import type { ProjectPerson, ProjectRecord } from "@/types/project";

/*
 * In-memory stand-in for the projects API, shaped like `demo-members.ts`: a
 * module-level array, the same latency shim, and getter signatures matching
 * the eventual endpoints (`GET /workspaces/:id/projects`) so swapping the
 * bodies for real queries is the whole migration.
 *
 * Every name here is invented and no address appears at all. The people reuse
 * the ids from `demo-members.ts` — `u-me` is the signed-in user in both — so
 * the roster and the projects table agree about who is who.
 */

/*
 * THE PINNED "TODAY".
 *
 * `new Date()` evaluated during render is a different instant on the server
 * than it is at hydration, so the Today marker would move between the two
 * passes and React would throw the node away with a mismatch warning. It also
 * goes stale on a tab nobody reloads. `format-date.ts` documents the same
 * constraint for display; this is the positioning half of it.
 *
 * So the demo's today is a constant. The timeline window and the Today marker
 * are both derived from it, and NOTHING in a render path calls `new Date()`
 * with no argument.
 */
export const DEMO_TODAY = "2026-09-03";

const PEOPLE = {
  wren: { id: "u-me", name: "Wren Adisa" },
  marisol: { id: "u-marisol", name: "Marisol Okonkwo-Vandenberg" },
  tavi: { id: "u-tavi", name: "Tavi" },
  jonah: { id: "u-jonah", name: "Jonah Ferreira" },
  priya: { id: "u-priya", name: "Priya Raghunathan" },
} as const satisfies Record<string, ProjectPerson>;

/*
 * One set of projects, returned for whichever workspace is open — the same
 * shortcut `demo-members.ts` takes, and for the same reason: the screens are
 * the point, not the seeding.
 *
 * The spread is deliberate. Five of the six statuses are used so Board,
 * Timeline and the status breakdown all look populated; TODO is used by
 * nobody, which is what exercises the empty board column and the 0% legend
 * row. TIZ-3 carries the longest name the table should tolerate, TIZ-4 has no
 * collaborators, and TIZ-6 has no dates at all.
 */
const projects: ProjectRecord[] = [
  {
    id: "TIZ-1",
    name: "Website redesign",
    status: "IN_PROGRESS",
    owner: PEOPLE.wren,
    collaborators: [PEOPLE.jonah, PEOPLE.priya, PEOPLE.tavi],
    startDate: "2026-08-10",
    endDate: "2026-10-02",
    priority: "HIGH",
    createdBy: PEOPLE.wren,
    createdTime: "2026-07-28T09:12:00.000Z",
  },
  {
    id: "TIZ-2",
    name: "Brand refresh",
    status: "COMPLETE",
    owner: PEOPLE.marisol,
    collaborators: [PEOPLE.wren],
    startDate: "2026-06-15",
    endDate: "2026-08-21",
    priority: "MEDIUM",
    createdBy: PEOPLE.tavi,
    createdTime: "2026-06-02T14:40:00.000Z",
  },
  {
    /* The longest name the UI should tolerate: it has to truncate in a table
       cell and wrap on a board card, never widen either. */
    id: "TIZ-3",
    name: "Motion planning SDK v3 migration and deprecation plan",
    status: "PLANNING",
    owner: PEOPLE.jonah,
    collaborators: [PEOPLE.wren, PEOPLE.marisol],
    startDate: "2026-09-14",
    endDate: "2026-12-04",
    priority: "HIGH",
    createdBy: PEOPLE.marisol,
    createdTime: "2026-08-19T07:05:00.000Z",
  },
  {
    /* No collaborators — the overlapping-avatar stack has to render nothing
       rather than an empty ring. */
    id: "TIZ-4",
    name: "Client onboarding",
    status: "PAUSED",
    owner: PEOPLE.tavi,
    collaborators: [],
    startDate: "2026-08-24",
    endDate: "2026-09-18",
    priority: "LOW",
    createdBy: PEOPLE.wren,
    createdTime: "2026-08-11T11:26:00.000Z",
  },
  {
    id: "TIZ-5",
    name: "Fleet telemetry ingest",
    status: "IN_PROGRESS",
    owner: PEOPLE.priya,
    collaborators: [PEOPLE.tavi, PEOPLE.jonah],
    startDate: "2026-09-01",
    endDate: "2026-11-13",
    priority: "MEDIUM",
    createdBy: PEOPLE.priya,
    createdTime: "2026-08-25T16:58:00.000Z",
  },
  {
    /* Filed, never scheduled. Both dates absent: the timeline must place no
       bar and say so, not compute an offset from `undefined`. */
    id: "TIZ-6",
    name: "Back-catalogue archive",
    status: "BACKLOG",
    owner: PEOPLE.wren,
    collaborators: [PEOPLE.marisol],
    priority: "LOW",
    createdBy: PEOPLE.jonah,
    createdTime: "2026-05-30T08:00:00.000Z",
  },
];

export function getWorkspaceProjects(
  workspaceId: string,
): Promise<ProjectRecord[]> {
  /* The one set stands in for every workspace, so the id only guards the empty
     case here. The real query filters on it. */
  return settle(workspaceId ? projects : []);
}

/** The signed-in user, as a project cell needs them. Same id as `demo-data.ts`. */
export function getProjectsCurrentUser(): Promise<ProjectPerson> {
  return settle<ProjectPerson>(PEOPLE.wren);
}

/**
 * One project by its human key — `"TIZ-1"`. `undefined` is the signal for
 * `notFound()`; the backlog page must not render a shell around a project that
 * does not exist.
 */
export function getProject(
  projectId: string,
): Promise<ProjectRecord | undefined> {
  return settle(projects.find((project) => project.id === projectId));
}
