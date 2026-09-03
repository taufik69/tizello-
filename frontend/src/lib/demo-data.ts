import { settle } from "@/lib/settle";
import type { CurrentUser, Workspace } from "@/types/workspace";

/*
 * In-memory stand-in for the workspaces API, shaped like `boards.ts`: a
 * module-level array, a latency shim, and getters whose signatures match the
 * eventual endpoints. Swapping the bodies for real queries is the whole
 * migration — nothing outside this file knows where the data comes from.
 *
 * Every name here is invented. No email addresses, no credentials.
 */

const currentUser: CurrentUser = { id: "u-me", name: "Wren Adisa" };

const workspaces: Workspace[] = [
  {
    id: "northwind-studio",
    name: "Northwind Studio",
    memberCount: 6,
    role: "OWNER",
    accent: "green",
    projects: [
      {
        id: "p-site",
        name: "Website redesign",
        description:
          "Marketing site rebuild — new information architecture, a component library, and a content migration off the old CMS.",
        taskCount: 34,
      },
      {
        id: "p-brand",
        name: "Brand refresh",
        description: "Logo, palette and voice guidelines.",
        taskCount: 8,
      },
      /* No description, no tasks: the emptiest row a project card can be. */
      { id: "p-onboarding", name: "Client onboarding", taskCount: 0 },
    ],
  },
  {
    /* Deliberately the longest name the UI should tolerate. */
    id: "atlas-robotics",
    name: "Atlas Robotics Platform Engineering",
    memberCount: 42,
    role: "MEMBER",
    accent: "blue",
    projects: [
      {
        id: "p-fleet",
        name: "Fleet telemetry",
        description: "Ingest, retention and the on-call dashboards.",
        taskCount: 127,
      },
      {
        id: "p-sdk",
        name: "Motion planning SDK v3 migration and deprecation plan",
        description:
          "Long-running migration: ship v3, dual-run against v2 for a quarter, then retire the old planner and its docs.",
        taskCount: 61,
      },
    ],
  },
  {
    id: "quiet-hours",
    name: "Quiet Hours",
    memberCount: 3,
    role: "MEMBER",
    accent: "purple",
    projects: [
      {
        id: "p-podcast",
        name: "Season two",
        description: "Twelve episodes, recorded fortnightly.",
        taskCount: 19,
      },
      { id: "p-archive", name: "Back-catalogue archive", taskCount: 4 },
    ],
  },
  {
    /* memberCount 1 — the singular/plural edge. */
    id: "lantern",
    name: "Lantern",
    memberCount: 1,
    role: "MEMBER",
    accent: "orange",
    projects: [
      {
        id: "p-reading",
        name: "Reading list",
        description: "Things to get through before the end of the year.",
        taskCount: 23,
      },
      { id: "p-notes", name: "Field notes", taskCount: 2 },
    ],
  },
];

export function getWorkspaces(): Promise<Workspace[]> {
  return settle(workspaces);
}

export function getWorkspace(
  workspaceId: string,
): Promise<Workspace | undefined> {
  return settle(workspaces.find((workspace) => workspace.id === workspaceId));
}

export function getCurrentUser(): Promise<CurrentUser> {
  return settle(currentUser);
}
