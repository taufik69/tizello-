import { settle } from "@/lib/settle";
import type { SprintRecord } from "@/types/sprint";

/*
 * In-memory stand-in for the sprints API, shaped like `demo-backlog.ts`: a
 * module-level array, the same latency shim, and a getter signature matching
 * the eventual endpoint (`GET /projects/:id/sprints`) so swapping the body for
 * a real query is the whole migration.
 *
 * Dates are anchored to `DEMO_TODAY` (2026-09-03) from `demo-projects.ts` — the
 * pinned today this app renders against. Two sprints have already closed, one
 * is running over today, and two are queued behind it.
 *
 * The numbering starts at 11 rather than 1: these are the sprints of a project
 * that has been going for a while, and a list whose oldest entry is "Sprint 1"
 * quietly implies the archive is complete. `SPR-*` keys do not collide with the
 * `TIZ-*` keys `demo-projects.ts` and `demo-backlog.ts` spend.
 *
 * The spread is deliberate. SPR-11 has NO GOAL and finished everything it
 * pulled in (100%); SPR-12 closed with work outstanding, which is the normal
 * case; SPR-13 is the one ACTIVE sprint, part-done; SPR-14 is EMPTY — zero
 * items, zero points, no goal, so the card has to render a bar at 0 and a
 * "nothing planned yet" line rather than NaN; SPR-15 carries the longest name
 * and the longest goal the card should tolerate.
 */
const sprints: SprintRecord[] = [
  {
    id: "SPR-11",
    name: "Sprint 11",
    startDate: "2026-07-06",
    endDate: "2026-07-17",
    state: "COMPLETED",
    itemCount: 9,
    totalPoints: 26,
    doneCount: 9,
  },
  {
    id: "SPR-12",
    name: "Sprint 12 — Search relevance",
    startDate: "2026-07-20",
    endDate: "2026-07-31",
    state: "COMPLETED",
    goal: "Publish should reindex on the hook, not on the cron.",
    itemCount: 11,
    totalPoints: 34,
    doneCount: 8,
  },
  {
    /* The one running sprint. Its window contains DEMO_TODAY, so the card's
       "days left" line has something true to say. */
    id: "SPR-13",
    name: "Sprint 13 — Navigation rebuild",
    startDate: "2026-08-31",
    endDate: "2026-09-11",
    state: "ACTIVE",
    goal: "Ship the three-section nav behind a flag, desktop and mobile.",
    itemCount: 8,
    totalPoints: 29,
    doneCount: 3,
  },
  {
    /* Booked, and nothing in it. No goal either — a time-box someone reserved
       on Friday and has not planned yet. */
    id: "SPR-14",
    name: "Sprint 14",
    startDate: "2026-09-14",
    endDate: "2026-09-25",
    state: "PLANNING",
    itemCount: 0,
    totalPoints: 0,
    doneCount: 0,
  },
  {
    /* The longest name and goal the card should tolerate: both have to wrap
       rather than push the badge or the kebab off the right edge. */
    id: "SPR-15",
    name: "Sprint 15 — Legacy CMS migration, redirect map and the content freeze dry run",
    startDate: "2026-09-28",
    endDate: "2026-10-09",
    state: "PLANNING",
    goal: "Everything that has to be true before the freeze starts: the export runs clean against staging, every retired URL has a destination, and the images are re-hosted with their alt text intact.",
    itemCount: 6,
    totalPoints: 21,
    doneCount: 0,
  },
];

/**
 * One project's sprints. The one set stands in for every project — the same
 * shortcut `demo-backlog.ts` takes, and for the same reason: the screen is the
 * point, not the seeding. The real query filters on the id.
 */
export function getProjectSprints(projectId: string): Promise<SprintRecord[]> {
  return settle(projectId ? sprints.map((sprint) => ({ ...sprint })) : []);
}
