import type { ProjectDraft } from "@/components/projects/project-properties";
import { createProjectAction } from "@/lib/actions/project-actions";
import { addProjectMembersAction } from "@/lib/actions/project-member-actions";
import { PROJECT_ERROR_COPY } from "@/types/project";
import type { ProjectPropertyPatch } from "@/types/project-property";

/*
 * What "create this project" actually does, with no drawer around it.
 *
 * Lifted out of `create-project-drawer.tsx` so that file stays under the
 * 150-line cap, and because it stopped being one request the moment the drawer
 * grew a Collaborators row: `POST /workspaces/:id/projects` accepts no member
 * list (`backend/docs/api/project.md` §1), so a project created with
 * collaborators is a create followed by N member posts.
 *
 * The two failures are deliberately different shapes. A failed CREATE is a
 * form error — nothing happened, the drawer stays open and points at the
 * field. A failed member post is a toast — the project exists by then, and
 * unwinding it to undo one invite would throw away a filled-in form.
 */
export type CreateOutcome =
  /** The drawer stays open. `fieldErrors` points at a row; `message` is a toast. */
  | { ok: false; fieldErrors?: Record<string, string>; message?: string }
  /** The drawer closes. `warning` is a toast shown instead of the success one. */
  | { ok: true; warning?: string };

export async function submitNewProject({
  workspaceId,
  draft,
  properties,
  people,
}: {
  workspaceId: string;
  draft: ProjectDraft;
  properties: ProjectPropertyPatch;
  /** Staged collaborator user ids, attached once the project has an id. */
  people: string[];
}): Promise<CreateOutcome> {
  const name = draft.name.trim();

  const result = await createProjectAction(workspaceId, {
    name,
    /* Sent only when the user typed one — a supplied key that collides is a
       `409`, where a derived one is silently suffixed. */
    key: draft.key.trim() || undefined,
    description: draft.description.trim() || undefined,
    status: draft.status,
    priority: draft.priority,
    icon: draft.icon || undefined,
    color: draft.color || undefined,
    startDate: draft.startDate || undefined,
    endDate: draft.endDate || undefined,
    /* Omitted entirely when nothing was filled in — the API validates the map
       against the workspace's definitions, and an empty object is a request
       that means nothing. */
    ...(Object.keys(properties).length > 0 ? { properties } : {}),
  });

  if (result.fieldErrors) return { ok: false, fieldErrors: result.fieldErrors };
  /* `CONFLICT` and `VALIDATION_ERROR` both have a field to point at, and their
     generic copy does not name it — see `PROJECT_ERROR_COPY`. */
  if (result.code === "CONFLICT") {
    return { ok: false, fieldErrors: { key: "That key is already used in this workspace." } };
  }
  if (result.code === "VALIDATION_ERROR") {
    return {
      ok: false,
      fieldErrors: { endDate: "End date cannot fall before the start date." },
    };
  }
  if (result.code) {
    return {
      ok: false,
      message: PROJECT_ERROR_COPY[result.code] ?? PROJECT_ERROR_COPY.SERVER_ERROR,
    };
  }

  if (people.length === 0 || !result.projectId) return { ok: true };

  const { failed } = await addProjectMembersAction(workspaceId, result.projectId, people);

  if (failed.length === 0) return { ok: true };

  return {
    ok: true,
    warning: `${name} was created, but ${failed.length} collaborator${
      failed.length > 1 ? "s" : ""
    } could not be added.`,
  };
}
