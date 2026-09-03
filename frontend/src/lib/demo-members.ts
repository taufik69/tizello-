import { settle } from "@/lib/settle";
import type { WorkspaceMember, WorkspaceRole } from "@/types/workspace";

/*
 * In-memory stand-in for the members API, shaped like `demo-data.ts`: a
 * module-level array, the same latency shim, and getter signatures matching
 * the eventual endpoints (`GET /workspaces/:id/members`) so swapping the
 * bodies for real queries is the whole migration.
 *
 * Every name and address here is invented, and every domain is non-routable
 * (`.test` is reserved by RFC 2606; `example.com` by RFC 6761). Nothing in
 * this file may ever resemble a real person or a credential.
 *
 * The signed-in user is `u-me` — "Wren Adisa" in `demo-data.ts`, who owns
 * `northwind-studio` there. The two fixtures agree on that one id on purpose:
 * the roster marks their row "You", and the header on the workspace page shows
 * the same role.
 */

/* One roster, returned for whichever workspace is open. Per-workspace rosters
   would mean inventing four of them, and the screen is the point here, not the
   seeding. The getter is already scoped by id, so the real query drops in
   without a caller changing. */
const members: WorkspaceMember[] = [
  {
    id: "m-wren",
    userId: "u-me",
    name: "Wren Adisa",
    email: "wren.adisa@northwind.test",
    role: "OWNER",
  },
  {
    /* Deliberately the longest name and address the row should tolerate: both
       have to truncate rather than push the controls off a 360px screen. */
    id: "m-marisol",
    userId: "u-marisol",
    name: "Marisol Okonkwo-Vandenberg",
    email: "marisol.okonkwo-vandenberg@northwind.test",
    role: "ADMIN",
  },
  {
    /* Single word: `initials()` yields one letter, which is the intended
       result rather than a bug. */
    id: "m-tavi",
    userId: "u-tavi",
    name: "Tavi",
    email: "tavi@northwind.test",
    role: "ADMIN",
  },
  {
    id: "m-jonah",
    userId: "u-jonah",
    name: "Jonah Ferreira",
    email: "j.ferreira@northwind.test",
    role: "MEMBER",
  },
  {
    id: "m-priya",
    userId: "u-priya",
    name: "Priya Raghunathan",
    email: "priya.r@example.com",
    role: "MEMBER",
  },
];

/** OWNER first, then ADMIN, then MEMBER; alphabetical inside a role. */
const ROLE_RANK: Record<WorkspaceRole, number> = {
  OWNER: 0,
  ADMIN: 1,
  MEMBER: 2,
};

/**
 * Returns a new array — the roster is re-sorted client-side after a role
 * change, and mutating the caller's state in place would not re-render.
 */
export function sortMembers(roster: WorkspaceMember[]): WorkspaceMember[] {
  return [...roster].sort(
    (a, b) =>
      ROLE_RANK[a.role] - ROLE_RANK[b.role] || a.name.localeCompare(b.name),
  );
}

export function getWorkspaceMembers(
  workspaceId: string,
): Promise<WorkspaceMember[]> {
  /* The one roster stands in for every workspace, so the id only guards the
     empty case here. The real query filters on it. */
  return settle(workspaceId ? sortMembers(members) : []);
}
