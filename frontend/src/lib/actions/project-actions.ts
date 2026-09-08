"use server";

import { revalidatePath } from "next/cache";
import {
  createProject,
  deleteProject,
  setProjectArchived,
  updateProject,
} from "@/lib/projects";
import type { ProjectFormState, ProjectPriority, ProjectStatus } from "@/types/project";

/*
 * Every project write. Thin by rule: validate, call a plain function from
 * `lib/projects.ts`, revalidate. The rules themselves live on the server — see
 * `backend/docs/api/project.md`.
 *
 * Plain arguments, not `(prevState, formData)` — these are called from
 * `useTransition` event handlers, the same shape as the workspace actions, not
 * from a `<form action>`. That is what lets a dialog branch on the result and
 * close itself synchronously in the handler instead of watching for success in
 * a `useEffect`, which would trip `react-hooks/set-state-in-effect` the moment
 * it called the parent's `onOpenChange`.
 *
 * **Permissions are not checked here.** `lib/project-roles.ts` decides which
 * controls are drawn; the API's `loadProject` + `requireProjectWrite` /
 * `requireProjectOwner` are what actually enforce them, and their `403`
 * arrives back as `code: "FORBIDDEN"`.
 */

const NAME_MIN = 2;
const NAME_MAX = 100;
const KEY_PATTERN = /^[A-Z][A-Z0-9]{1,4}$/;

/** Every write path runs the same length rule, so none can drift from the API's Joi schema alone. */
function nameError(name: string): string | undefined {
  return name.length < NAME_MIN || name.length > NAME_MAX
    ? `Must be ${NAME_MIN}–${NAME_MAX} characters.`
    : undefined;
}

/**
 * A supplied key is checked here as well as server-side because its failure
 * mode is unusually unhelpful: a malformed key is a `400` with a Joi sentence,
 * and a valid-but-taken one is a `409` that only arrives after a round trip.
 * Catching the malformed case locally leaves `409` meaning exactly one thing.
 */
function keyError(key: string): string | undefined {
  return KEY_PATTERN.test(key)
    ? undefined
    : "2–5 characters, uppercase letters and digits, starting with a letter.";
}

/**
 * Both routes that render a project list, after any write that can change what
 * either shows. The workspace detail page is revalidated too: its projects grid
 * reads the same rows.
 */
function revalidateProjects(workspaceId: string) {
  revalidatePath(`/workspaces/${workspaceId}`);
  revalidatePath(`/workspaces/${workspaceId}/projects`);
}

/**
 * `POST /workspaces/:workspaceId/projects`.
 *
 * `key` is forwarded only when the user actually typed one. Omitting it lets
 * the API derive one from the name and silently suffix a collision; sending
 * one turns that collision into a `409` the user has to resolve (contract
 * §*Key* 2). Passing a key nobody chose would trade a transparent retry for an
 * error with no obvious fix.
 */
export async function createProjectAction(
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
  },
): Promise<ProjectFormState> {
  const name = input.name.trim();
  const key = input.key?.trim().toUpperCase();
  const description = input.description?.trim();

  const invalidName = nameError(name);
  if (invalidName) return { fieldErrors: { name: invalidName } };

  if (key) {
    const invalidKey = keyError(key);
    if (invalidKey) return { fieldErrors: { key: invalidKey } };
  }

  /* Every optional field is omitted rather than sent empty: the API validates
     `description` as 1–2000 chars when present, so `""` is a 400, not a clear. */
  const result = await createProject(workspaceId, {
    name,
    ...(key ? { key } : {}),
    ...(description ? { description } : {}),
    ...(input.status ? { status: input.status } : {}),
    ...(input.priority ? { priority: input.priority } : {}),
    ...(input.icon ? { icon: input.icon } : {}),
    ...(input.color ? { color: input.color } : {}),
    ...(input.startDate ? { startDate: input.startDate } : {}),
    ...(input.endDate ? { endDate: input.endDate } : {}),
  });

  if (!result.ok) return { code: result.code, fieldErrors: result.fieldErrors };

  revalidateProjects(workspaceId);
  return { done: true };
}

/**
 * `PATCH /projects/:id`.
 *
 * `null` is meaningful on `description` / `icon` / `color` / the dates — it is
 * how the API clears a value — so it has to survive the trip as `null` rather
 * than being dropped as falsy. Only fields the caller actually passed are
 * forwarded, and an empty patch is rejected here rather than sent: the API
 * answers `{}` with a `400`, and "Provide at least one field to update" is not
 * a sentence to show someone who pressed Save without changing anything.
 */
export async function updateProjectAction(
  workspaceId: string,
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
  },
): Promise<ProjectFormState> {
  if (patch.name !== undefined) {
    const invalid = nameError(patch.name.trim());
    if (invalid) return { fieldErrors: { name: invalid } };
  }

  if (Object.keys(patch).length === 0) return { done: true };

  const result = await updateProject(projectId, {
    ...patch,
    ...(patch.name !== undefined ? { name: patch.name.trim() } : {}),
  });

  if (!result.ok) return { code: result.code, fieldErrors: result.fieldErrors };

  revalidateProjects(workspaceId);
  return { done: true };
}

/** `PATCH /projects/:id/archive`. Both directions — un-archiving is the same call with the other value. */
export async function setProjectArchivedAction(
  workspaceId: string,
  projectId: string,
  isArchived: boolean,
): Promise<ProjectFormState> {
  const result = await setProjectArchived(projectId, isArchived);

  if (!result.ok) return { code: result.code };

  revalidateProjects(workspaceId);
  return { done: true };
}

/** `DELETE /projects/:id`. Soft-delete server-side, permanent from here — and owner-only, so a MANAGER's attempt comes back `FORBIDDEN`. */
export async function deleteProjectAction(
  workspaceId: string,
  projectId: string,
): Promise<ProjectFormState> {
  const result = await deleteProject(projectId);

  if (!result.ok) return { code: result.code };

  revalidateProjects(workspaceId);
  return { done: true };
}
