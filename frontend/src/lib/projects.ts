import { apiCallWithRefresh } from "@/lib/api-client";
import { fieldErrorsFrom } from "@/lib/field-errors";
import type { ActionResult } from "@/lib/workspaces";
import type { ProjectPriority, ProjectRecord, ProjectStatus } from "@/types/project";
import type {
  ProjectPropertyPatch,
  ProjectPropertyValues,
} from "@/types/project-property";

/*
 * The project API — `backend/docs/api/project.md`. Replaces the
 * `getWorkspaceProjects()` fixture in `demo-projects.ts`.
 *
 * Every call goes through `apiCallWithRefresh`: these are all authenticated,
 * and a 15-minute access token expiring mid-session should renew transparently
 * rather than bouncing the user to sign-in.
 *
 * TWO PREFIXES, one module, because the API has two (contract §*divergence
 * 4*): create and list carry the workspace in the path so the server can
 * resolve a membership; everything else is addressed by the project's own
 * globally unique id. Do not "tidy" these into one — a project id alone cannot
 * answer a permission check on create, since there is no project yet.
 *
 * THE OWNER GAP
 * -------------
 * `ProjectRecord.ownerId` is what every response carries. A NAME for that id
 * is only available from `GET /projects/:id/members` (§7), which is per
 * project — resolving names for a 20-row list would be 20 requests against a
 * 100-per-15-minutes budget. There is no workspace-members endpoint to resolve
 * them in one call; `/workspaces/:id/members` does not exist yet, which is
 * also why the members SCREEN is still fixture-backed. So list rows carry
 * `ownerId` and no `owner`, and the table renders "You" or a neutral dash.
 * When that endpoint lands, resolving the map once per page is the whole fix.
 */

/** The API's row shape. Kept separate from `ProjectRecord` so a server-side rename cannot silently reshape the UI type. */
export type ApiProject = {
  id: string;
  name: string;
  key: string;
  description: string | null;
  status: ProjectStatus;
  priority: ProjectPriority;
  icon: string | null;
  color: string | null;
  startDate: string | null;
  endDate: string | null;
  isArchived: boolean;
  workspaceId: string;
  ownerId: string;
  viewerRole: ProjectRecord["viewerRole"];
  properties: ProjectPropertyValues;
  createdAt: string;
  updatedAt: string;
};

export const toProject = (row: ApiProject): ProjectRecord => row;

/** The API's page-size ceiling for projects — contract §2. */
const MAX_PAGE_SIZE = 100;

export type ProjectListQuery = {
  status?: ProjectStatus;
  priority?: ProjectPriority;
  includeArchived?: boolean;
  /** Matches name OR key, case-insensitively — a key is what people actually type. */
  q?: string;
  /** Owned or collaborated on, never owned alone. */
  mine?: boolean;
};

/**
 * `GET /workspaces/:workspaceId/projects`.
 *
 * `includeArchived` has to be a parameter rather than a filter on the result:
 * the API omits archived rows entirely unless it is sent, so an archived
 * project is not in the payload to filter out. Same constraint as
 * `getWorkspaces`.
 *
 * Returns `[]` on any failure, including the `404` a non-member gets — the
 * caller has already resolved the workspace, so a failure here is an empty
 * screen rather than a thrown page.
 */
export async function getWorkspaceProjects(
  workspaceId: string,
  { status, priority, includeArchived = false, q, mine = false }: ProjectListQuery = {},
): Promise<ProjectRecord[]> {
  const params = new URLSearchParams({ limit: String(MAX_PAGE_SIZE) });
  if (status) params.set("status", status);
  if (priority) params.set("priority", priority);
  if (includeArchived) params.set("includeArchived", "true");
  if (q) params.set("q", q);
  if (mine) params.set("mine", "true");

  const result = await apiCallWithRefresh<ApiProject[]>(
    `/workspaces/${encodeURIComponent(workspaceId)}/projects?${params}`,
  );

  return result.ok ? result.data.map(toProject) : [];
}

/** `GET /projects/:id`. `null` covers all three 404s — nonexistent, soft-deleted, and not-a-member — which the API answers identically (contract §3). */
export async function getProject(projectId: string): Promise<ProjectRecord | null> {
  const result = await apiCallWithRefresh<{ project: ApiProject }>(
    `/projects/${encodeURIComponent(projectId)}`,
  );

  return result.ok ? toProject(result.data.project) : null;
}

/**
 * `POST /workspaces/:workspaceId/projects`.
 *
 * `key` is optional and, when omitted, derived server-side from `name`. Send
 * it only when the user typed one: a supplied key that collides is a `409`,
 * where a derived one is silently suffixed (contract §*Key* 2). Passing a
 * key the user did not choose turns a transparent retry into an error they
 * cannot act on.
 */
export async function createProject(
  workspaceId: string,
  input: {
    name: string;
    key?: string;
    description?: string;
    status?: ProjectStatus;
    priority?: ProjectPriority;
    icon?: string;
    color?: string;
    startDate?: string;
    endDate?: string;
    /** Values for the workspace's custom properties, keyed by definition id. */
    properties?: ProjectPropertyPatch;
  },
): Promise<ActionResult<ProjectRecord>> {
  const result = await apiCallWithRefresh<{ project: ApiProject }>(
    `/workspaces/${encodeURIComponent(workspaceId)}/projects`,
    { method: "POST", body: input },
  );

  if (!result.ok) {
    return { ok: false, code: result.code, fieldErrors: fieldErrorsFrom(result.details) };
  }

  return { ok: true, data: toProject(result.data.project) };
}

/**
 * `PATCH /projects/:id`. Caller sends only changed fields — the API rejects an
 * empty body with a `400`.
 *
 * `key` is absent from the patch type on purpose: it is immutable after create
 * (contract §*Key* 5), so this is not a field a caller can forget to omit.
 * `isArchived` is absent too — that is its own endpoint, because status and
 * archive are separate axes.
 */
export async function updateProject(
  projectId: string,
  patch: {
    name?: string;
    description?: string | null;
    status?: ProjectStatus;
    priority?: ProjectPriority;
    icon?: string | null;
    color?: string | null;
    startDate?: string | null;
    endDate?: string | null;
    /** Partial and keyed by definition id; `null` on a key DELETES that value. */
    properties?: ProjectPropertyPatch;
  },
): Promise<ActionResult<ProjectRecord>> {
  const result = await apiCallWithRefresh<{ project: ApiProject }>(
    `/projects/${encodeURIComponent(projectId)}`,
    { method: "PATCH", body: patch },
  );

  if (!result.ok) {
    return { ok: false, code: result.code, fieldErrors: fieldErrorsFrom(result.details) };
  }

  return { ok: true, data: toProject(result.data.project) };
}

/** `PATCH /projects/:id/archive`. Both directions through one call — un-archiving is the same operation with the other value. */
export async function setProjectArchived(
  projectId: string,
  isArchived: boolean,
): Promise<ActionResult<ProjectRecord>> {
  const result = await apiCallWithRefresh<{ project: ApiProject }>(
    `/projects/${encodeURIComponent(projectId)}/archive`,
    { method: "PATCH", body: { isArchived } },
  );

  return result.ok
    ? { ok: true, data: toProject(result.data.project) }
    : { ok: false, code: result.code };
}

/** `DELETE /projects/:id`. Soft on the server, permanent from here — there is no undelete endpoint. */
export async function deleteProject(projectId: string): Promise<ActionResult> {
  const result = await apiCallWithRefresh(`/projects/${encodeURIComponent(projectId)}`, {
    method: "DELETE",
  });

  return result.ok ? { ok: true, data: undefined } : { ok: false, code: result.code };
}
