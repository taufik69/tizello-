"use server";

import { revalidatePath } from "next/cache";
import {
  addProjectMember,
  removeProjectMember,
  updateProjectMemberRole,
} from "@/lib/project-members";
import type { AssignableProjectRole, ProjectMemberRecord } from "@/types/project";

/*
 * Writes to a project's collaborator list —
 * `backend/docs/api/project.md` §§8-10.
 *
 * These write IMMEDIATELY rather than riding the drawer's Save, because a
 * collaborator is a row in another table rather than a field of the project.
 * Holding it behind Save would mean a "collaborator" who exists only in an
 * unsaved form, and a cancel that silently un-invited someone.
 *
 * **Permissions are not checked here.** `requireProjectWrite` on the API is
 * what enforces them, and its `403` arrives back as `code: "FORBIDDEN"`. The
 * `409` for targeting the owner is enforced there too — ownership moves
 * through transfer alone.
 */

type MemberState = {
  code?: string;
  member?: ProjectMemberRecord;
};

/** The project's own page and the list it appears in both show collaborators. */
function revalidateProject(workspaceId: string, projectId: string) {
  revalidatePath(`/workspaces/${workspaceId}/projects`);
  revalidatePath(`/workspaces/${workspaceId}/projects/${projectId}`);
}

export async function addProjectMemberAction(
  workspaceId: string,
  projectId: string,
  userId: string,
  role: AssignableProjectRole = "COLLABORATOR",
): Promise<MemberState> {
  const result = await addProjectMember(projectId, userId, role);

  if (!result.ok) return { code: result.code };

  revalidateProject(workspaceId, projectId);
  return { member: result.data };
}

export async function updateProjectMemberRoleAction(
  workspaceId: string,
  projectId: string,
  userId: string,
  role: AssignableProjectRole,
): Promise<MemberState> {
  const result = await updateProjectMemberRole(projectId, userId, role);

  if (!result.ok) return { code: result.code };

  revalidateProject(workspaceId, projectId);
  return { member: result.data };
}

/** Detaches them from the project. They keep READ access if they are still in the workspace. */
export async function removeProjectMemberAction(
  workspaceId: string,
  projectId: string,
  userId: string,
): Promise<MemberState> {
  const result = await removeProjectMember(projectId, userId);

  if (!result.ok) return { code: result.code };

  revalidateProject(workspaceId, projectId);
  return {};
}

/**
 * Adds several collaborators at once, for the create drawer.
 *
 * `POST /workspaces/:id/projects` takes no member list
 * (`backend/docs/api/project.md` §1), so a project created with collaborators
 * is one create followed by N member posts. They run in SEQUENCE rather than
 * in parallel: `projectCreateLimiter` is not the only limiter on that route
 * and a burst of eight is how a fast form trips a `429` that a slow one never
 * would.
 *
 * It returns the ids that FAILED rather than a single code. The project
 * already exists by the time this runs, so "the whole thing failed" is never
 * the truth — the caller says who did not make it and leaves the rest alone.
 */
export async function addProjectMembersAction(
  workspaceId: string,
  projectId: string,
  userIds: string[],
): Promise<{ failed: string[] }> {
  const failed: string[] = [];

  for (const userId of userIds) {
    const result = await addProjectMember(projectId, userId, "COLLABORATOR");
    if (!result.ok) failed.push(userId);
  }

  revalidateProject(workspaceId, projectId);
  return { failed };
}
