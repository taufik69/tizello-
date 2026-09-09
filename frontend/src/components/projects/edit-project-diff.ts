import type { ProjectRecord } from "@/types/project";
import type { ProjectPropertyPatch } from "@/types/project-property";
import type { ProjectDraft } from "@/components/projects/project-properties";

/*
 * What "changed" means for the edit drawer, as two pure functions.
 *
 * Lifted out of `edit-project-drawer.tsx` so that file stays under the
 * 150-line cap, and because a diff is exactly the kind of logic worth being
 * able to read without a component around it.
 */

/** The stored project, flattened to the shape the form edits. Dates are sliced to `YYYY-MM-DD` — the API returns full ISO timestamps and the pickers speak days. */
export function draftFrom(project: ProjectRecord): ProjectDraft {
  return {
    name: project.name,
    key: project.key,
    description: project.description ?? "",
    status: project.status,
    priority: project.priority,
    icon: project.icon ?? "",
    color: project.color ?? "",
    startDate: project.startDate?.slice(0, 10) ?? "",
    endDate: project.endDate?.slice(0, 10) ?? "",
  };
}

/**
 * Only the property values that actually changed.
 *
 * Sending the whole map would work and would also make every save a write for
 * properties nobody touched — and would clobber a value a teammate set in
 * between. `JSON.stringify` rather than `===` because a MULTI_SELECT value is
 * an array, and two equal arrays are never `===`.
 */
export function changedProperties(
  before: ProjectPropertyPatch,
  after: ProjectPropertyPatch,
): ProjectPropertyPatch | null {
  const patch: ProjectPropertyPatch = {};

  for (const [id, value] of Object.entries(after)) {
    if (JSON.stringify(before[id]) !== JSON.stringify(value)) patch[id] = value;
  }

  return Object.keys(patch).length > 0 ? patch : null;
}
