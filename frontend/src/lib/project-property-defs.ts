import { apiCallWithRefresh } from "@/lib/api-client";
import { fieldErrorsFrom } from "@/lib/field-errors";
import type { ActionResult } from "@/lib/workspaces";
import type {
  ProjectPropertyDef,
  PropertyOption,
  PropertyType,
} from "@/types/project-property";

/*
 * The workspace's project-property SCHEMA —
 * `backend/docs/api/project-property.md` §§1-4.
 *
 * Definitions only. The VALUES ride on `PATCH /projects/:id` as one more field
 * (`lib/projects.ts`), because they are part of the project — a second
 * endpoint would make "save the project" two requests that can half-fail.
 *
 * Every write here is workspace-admin-only on the server. `lib/project-roles.ts`
 * decides which controls are drawn; the API's `requirePermission` is what
 * enforces it, and its `403` arrives back as `code: "FORBIDDEN"`.
 */

/** `GET /workspaces/:id/properties`. Ordered by position — the array arrives sorted. */
export async function getProjectPropertyDefs(
  workspaceId: string,
): Promise<ProjectPropertyDef[]> {
  const result = await apiCallWithRefresh<{ properties: ProjectPropertyDef[] }>(
    `/workspaces/${encodeURIComponent(workspaceId)}/properties`,
  );

  return result.ok ? result.data.properties : [];
}

/**
 * `POST /workspaces/:id/properties`.
 *
 * `options` is sent only for the two types that accept it — the API answers
 * `400 "Only Select and Multi-select properties can have options"` otherwise,
 * so sending `[]` for a TEXT property would fail a request that meant nothing
 * by it.
 */
export async function createProjectPropertyDef(
  workspaceId: string,
  input: { name: string; type: PropertyType; options?: PropertyOption[] },
): Promise<ActionResult<ProjectPropertyDef>> {
  const result = await apiCallWithRefresh<{ property: ProjectPropertyDef }>(
    `/workspaces/${encodeURIComponent(workspaceId)}/properties`,
    { method: "POST", body: input },
  );

  if (!result.ok) {
    return { ok: false, code: result.code, fieldErrors: fieldErrorsFrom(result.details) };
  }

  return { ok: true, data: result.data.property };
}

/** `PATCH .../properties/:id`. `type` is absent from the patch type because it is immutable server-side. */
export async function updateProjectPropertyDef(
  workspaceId: string,
  propertyId: string,
  patch: { name?: string; options?: PropertyOption[]; position?: number },
): Promise<ActionResult<ProjectPropertyDef>> {
  const result = await apiCallWithRefresh<{ property: ProjectPropertyDef }>(
    `/workspaces/${encodeURIComponent(workspaceId)}/properties/${encodeURIComponent(propertyId)}`,
    { method: "PATCH", body: patch },
  );

  if (!result.ok) {
    return { ok: false, code: result.code, fieldErrors: fieldErrorsFrom(result.details) };
  }

  return { ok: true, data: result.data.property };
}

/**
 * `DELETE .../properties/:id`.
 *
 * Removes the column from every project in the workspace. Values already
 * stored are orphaned rather than rewritten and vanish from every response
 * immediately — which is why this needs a confirmation, not a bare click.
 */
export async function deleteProjectPropertyDef(
  workspaceId: string,
  propertyId: string,
): Promise<ActionResult> {
  const result = await apiCallWithRefresh(
    `/workspaces/${encodeURIComponent(workspaceId)}/properties/${encodeURIComponent(propertyId)}`,
    { method: "DELETE" },
  );

  return result.ok ? { ok: true, data: undefined } : { ok: false, code: result.code };
}
