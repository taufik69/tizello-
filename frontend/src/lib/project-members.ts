import { apiCallWithRefresh } from "@/lib/api-client";
import { fieldErrorsFrom } from "@/lib/field-errors";
import { toProject, type ApiProject } from "@/lib/projects";
import type { ActionResult } from "@/lib/workspaces";
import type {
  AssignableProjectRole,
  ProjectMemberRecord,
  ProjectRecord,
} from "@/types/project";

/*
 * The project MEMBER endpoints — `backend/docs/api/project.md` §§7-11.
 *
 * A second file rather than more of `lib/projects.ts` for the reason the
 * backend keeps them in one module and the frontend cannot: these five calls
 * are about people, every one of them needs the role vocabulary, and together
 * they push the project file past the 150-line cap `eslint.config.mjs`
 * enforces. The seam is the same one the contract draws between §§1-6 and
 * §§7-11.
 *
 * Transfer lives here rather than beside `updateProject` because it is the
 * other half of the member story: §§9 and 10 refuse to touch the owner
 * precisely so this stays the single write path to ownership, and splitting
 * the refusal from the exception hides the rule.
 */

/** `GET /projects/:id/members`. Owner first — the API orders by the enum's own declaration order, so this array arrives sorted. */
export async function getProjectMembers(projectId: string): Promise<ProjectMemberRecord[]> {
  const result = await apiCallWithRefresh<ProjectMemberRecord[]>(
    `/projects/${encodeURIComponent(projectId)}/members?limit=100`,
  );

  return result.ok ? result.data : [];
}

/**
 * `POST /projects/:id/members`.
 *
 * `role` cannot be `OWNER` — the type says so because the API's validator does
 * (contract §8). Ownership moves through `transferProjectOwnership` alone.
 * A `422` here means the target is not in the project's workspace.
 */
export async function addProjectMember(
  projectId: string,
  userId: string,
  role: AssignableProjectRole = "COLLABORATOR",
): Promise<ActionResult<ProjectMemberRecord>> {
  const result = await apiCallWithRefresh<{ member: ProjectMemberRecord }>(
    `/projects/${encodeURIComponent(projectId)}/members`,
    { method: "POST", body: { userId, role } },
  );

  if (!result.ok) {
    return { ok: false, code: result.code, fieldErrors: fieldErrorsFrom(result.details) };
  }

  return { ok: true, data: result.data.member };
}

/** `PATCH /projects/:id/members/:userId`. A `409` means the target is the owner — use transfer instead. */
export async function updateProjectMemberRole(
  projectId: string,
  userId: string,
  role: AssignableProjectRole,
): Promise<ActionResult<ProjectMemberRecord>> {
  const result = await apiCallWithRefresh<{ member: ProjectMemberRecord }>(
    `/projects/${encodeURIComponent(projectId)}/members/${encodeURIComponent(userId)}`,
    { method: "PATCH", body: { role } },
  );

  return result.ok
    ? { ok: true, data: result.data.member }
    : { ok: false, code: result.code };
}

/** `DELETE /projects/:id/members/:userId`. A removed member keeps READ access if they are still in the workspace; what they lose is write. */
export async function removeProjectMember(
  projectId: string,
  userId: string,
): Promise<ActionResult> {
  const result = await apiCallWithRefresh(
    `/projects/${encodeURIComponent(projectId)}/members/${encodeURIComponent(userId)}`,
    { method: "DELETE" },
  );

  return result.ok ? { ok: true, data: undefined } : { ok: false, code: result.code };
}

/**
 * `PATCH /projects/:id/transfer-ownership`.
 *
 * One server-side transaction moves the column, promotes the new owner and
 * demotes the old one to MANAGER. There is no client-side equivalent to
 * assemble from the member endpoints — they refuse to touch the owner
 * precisely so this stays the single write path.
 */
export async function transferProjectOwnership(
  projectId: string,
  userId: string,
): Promise<ActionResult<ProjectRecord>> {
  const result = await apiCallWithRefresh<{ project: ApiProject }>(
    `/projects/${encodeURIComponent(projectId)}/transfer-ownership`,
    { method: "PATCH", body: { userId } },
  );

  return result.ok
    ? { ok: true, data: toProject(result.data.project) }
    : { ok: false, code: result.code };
}
