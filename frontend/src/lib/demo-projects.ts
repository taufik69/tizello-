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
    id: "demo-project-1",
    key: "TIZ1",
    name: "Website redesign",
    description: null,
    status: "ACTIVE",
    ownerId: PEOPLE.wren.id,
    owner: PEOPLE.wren,
    collaborators: [PEOPLE.jonah, PEOPLE.priya, PEOPLE.tavi],
    startDate: "2026-08-10",
    endDate: "2026-10-02",
    priority: "HIGH",
    icon: null,
    color: null,
    properties: {},
    isArchived: false,
    workspaceId: "demo-workspace",
    viewerRole: "OWNER",
    createdAt: "2026-07-28T09:12:00.000Z",
    updatedAt: "2026-07-28T09:12:00.000Z",
  },
  {
    id: "demo-project-2",
    key: "TIZ2",
    name: "Brand refresh",
    description: null,
    status: "COMPLETED",
    ownerId: PEOPLE.marisol.id,
    owner: PEOPLE.marisol,
    collaborators: [PEOPLE.wren],
    startDate: "2026-06-15",
    endDate: "2026-08-21",
    priority: "MEDIUM",
    icon: null,
    color: null,
    properties: {},
    isArchived: false,
    workspaceId: "demo-workspace",
    viewerRole: "OWNER",
    createdAt: "2026-06-02T14:40:00.000Z",
    updatedAt: "2026-06-02T14:40:00.000Z",
  },
  {
    /* The longest name the UI should tolerate: it has to truncate in a table
       cell and wrap on a board card, never widen either. */
    id: "demo-project-3",
    key: "TIZ3",
    name: "Motion planning SDK v3 migration and deprecation plan",
    description: null,
    status: "PLANNING",
    ownerId: PEOPLE.jonah.id,
    owner: PEOPLE.jonah,
    collaborators: [PEOPLE.wren, PEOPLE.marisol],
    startDate: "2026-09-14",
    endDate: "2026-12-04",
    priority: "HIGH",
    icon: null,
    color: null,
    properties: {},
    isArchived: false,
    workspaceId: "demo-workspace",
    viewerRole: "OWNER",
    createdAt: "2026-08-19T07:05:00.000Z",
    updatedAt: "2026-08-19T07:05:00.000Z",
  },
  {
    /* No collaborators — the overlapping-avatar stack has to render nothing
       rather than an empty ring. */
    id: "demo-project-4",
    key: "TIZ4",
    name: "Client onboarding",
    description: null,
    status: "ON_HOLD",
    ownerId: PEOPLE.tavi.id,
    owner: PEOPLE.tavi,
    collaborators: [],
    startDate: "2026-08-24",
    endDate: "2026-09-18",
    priority: "LOW",
    icon: null,
    color: null,
    properties: {},
    isArchived: false,
    workspaceId: "demo-workspace",
    viewerRole: "OWNER",
    createdAt: "2026-08-11T11:26:00.000Z",
    updatedAt: "2026-08-11T11:26:00.000Z",
  },
  {
    id: "demo-project-5",
    key: "TIZ5",
    name: "Fleet telemetry ingest",
    description: null,
    status: "ACTIVE",
    ownerId: PEOPLE.priya.id,
    owner: PEOPLE.priya,
    collaborators: [PEOPLE.tavi, PEOPLE.jonah],
    startDate: "2026-09-01",
    endDate: "2026-11-13",
    priority: "MEDIUM",
    icon: null,
    color: null,
    properties: {},
    isArchived: false,
    workspaceId: "demo-workspace",
    viewerRole: "OWNER",
    createdAt: "2026-08-25T16:58:00.000Z",
    updatedAt: "2026-08-25T16:58:00.000Z",
  },
  {
    /* Filed, never scheduled. Both dates absent: the timeline must place no
       bar and say so, not compute an offset from `undefined`. */
    id: "demo-project-6",
    key: "TIZ6",
    name: "Back-catalogue archive",
    description: null,
    status: "BACKLOG",
    ownerId: PEOPLE.wren.id,
    owner: PEOPLE.wren,
    collaborators: [PEOPLE.marisol],
    startDate: null,
    endDate: null,
    priority: "LOW",
    icon: null,
    color: null,
    properties: {},
    isArchived: false,
    workspaceId: "demo-workspace",
    viewerRole: "OWNER",
    createdAt: "2026-05-30T08:00:00.000Z",
    updatedAt: "2026-05-30T08:00:00.000Z",
  },
];

/**
 * One project by id. `undefined` is the signal for `notFound()`.
 *
 * **`/workspaces/:id/projects` no longer calls this** — it reads the real API
 * through `lib/projects.ts`. What is left leaning on this file is the sprint,
 * backlog and board surface, whose own modules do not exist server-side yet
 * and which needs a `ProjectRecord` to head their pages with.
 *
 * `getWorkspaceProjects` and `getProjectsCurrentUser` are gone: both have real
 * equivalents now (`lib/projects.ts` and `getSession`), and leaving a fixture
 * with the same name next to them is how a screen ends up silently reading
 * invented data.
 */
export function getProject(
  projectId: string,
): Promise<ProjectRecord | undefined> {
  return settle(projects.find((project) => project.id === projectId));
}
