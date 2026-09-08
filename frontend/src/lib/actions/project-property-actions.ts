"use server";

import { revalidatePath } from "next/cache";
import {
  createProjectPropertyDef,
  deleteProjectPropertyDef,
  updateProjectPropertyDef,
} from "@/lib/project-property-defs";
import type { ProjectPropertyDef, PropertyOption, PropertyType } from "@/types/project-property";

/*
 * Writes to the workspace's project-property SCHEMA. Thin by rule: call a plain
 * function from `lib/project-property-defs.ts`, revalidate. The rules live on
 * the server — see `backend/docs/api/project-property.md`.
 *
 * These write IMMEDIATELY rather than riding a project's Save, because a
 * definition belongs to the workspace: holding "add a column" behind one
 * person's project edit would make the column appear for everyone only when
 * that person finished, and vanish if they cancelled.
 *
 * **Permissions are not checked here.** The API's
 * `requirePermission(PROJECT_MANAGE_ANY)` is what enforces admin-only, and its
 * `403` arrives back as `code: "FORBIDDEN"`.
 */

type PropertyFormState = {
  code?: string;
  fieldErrors?: Record<string, string>;
  property?: ProjectPropertyDef;
};

/** Every project list and detail page renders these columns, so all of them go stale together. */
function revalidateWorkspace(workspaceId: string) {
  revalidatePath(`/workspaces/${workspaceId}`);
  revalidatePath(`/workspaces/${workspaceId}/projects`, "layout");
}

export async function createPropertyDefAction(
  workspaceId: string,
  input: { name: string; type: PropertyType; options?: PropertyOption[] },
): Promise<PropertyFormState> {
  const name = input.name.trim();
  if (!name) return { fieldErrors: { name: "Give the property a name." } };

  const result = await createProjectPropertyDef(workspaceId, {
    name,
    type: input.type,
    /* Sent only for the two types that accept it — the API answers `400` for
       the other seven, so an unconditional `[]` would fail a request that
       meant nothing by it. */
    ...(input.options ? { options: input.options } : {}),
  });

  if (!result.ok) return { code: result.code, fieldErrors: result.fieldErrors };

  revalidateWorkspace(workspaceId);
  return { property: result.data };
}

export async function updatePropertyDefAction(
  workspaceId: string,
  propertyId: string,
  patch: { name?: string; options?: PropertyOption[]; position?: number },
): Promise<PropertyFormState> {
  const result = await updateProjectPropertyDef(workspaceId, propertyId, patch);

  if (!result.ok) return { code: result.code, fieldErrors: result.fieldErrors };

  revalidateWorkspace(workspaceId);
  return { property: result.data };
}

/** Removes the column from every project in the workspace. Values are orphaned server-side, never rewritten. */
export async function deletePropertyDefAction(
  workspaceId: string,
  propertyId: string,
): Promise<PropertyFormState> {
  const result = await deleteProjectPropertyDef(workspaceId, propertyId);

  if (!result.ok) return { code: result.code };

  revalidateWorkspace(workspaceId);
  return {};
}
