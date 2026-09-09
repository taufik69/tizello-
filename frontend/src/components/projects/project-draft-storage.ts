import {
  EMPTY_DRAFT,
  OPTIONAL_PROPERTIES,
  type OptionalProperty,
  type ProjectDraft,
} from "@/components/projects/project-properties";
import type { ProjectPropertyPatch } from "@/types/project-property";

/*
 * The unsaved "New project" drawer, kept across a reload.
 *
 * WHY LOCAL STORAGE AND NOT THE SERVER. There is no draft endpoint — a project
 * exists or it does not (`backend/docs/api/project.md` §1) — so the only place
 * an unfinished form can live is the browser it is being typed into. That also
 * makes it the right place: a draft is one person's half-finished thought, not
 * something a teammate should see appear in the project list.
 *
 * WHAT IS NOT KEPT. Only what the user chose. Uploaded FILES metadata IS kept,
 * and that is deliberate rather than an oversight: the bytes are already on the
 * server by then (`POST /uploads` writes before the drawer is saved — see
 * `files-value-field.tsx`), so the entry still resolves after a reload. Losing
 * it would leave the file on disk referenced by nothing, which is the orphan
 * `upload.service.js` already documents.
 *
 * SCOPED PER WORKSPACE, because the drawer is: every "+ New project" trigger on
 * a workspace opens the same one, and two workspaces are two different forms.
 *
 * Every access is wrapped. `localStorage` throws outright in some contexts — a
 * browser set to block site data, a privacy mode, a quota that is already full
 * — and a drawer that cannot open because a draft could not be read would be a
 * worse bug than the one this fixes.
 */
const PREFIX = "tizello-project-draft";

export type StoredProjectDraft = {
  draft: ProjectDraft;
  shown: OptionalProperty[];
  properties: ProjectPropertyPatch;
  /** Staged collaborator user ids. */
  people: string[];
  /**
   * Whether the Key was typed rather than derived from the name.
   *
   * Kept because it changes what the create request SENDS, not just what the
   * field shows: an untouched key is omitted so the server can suffix a
   * collision silently. Losing this across a reload would turn a key somebody
   * chose back into one the name implies. Optional — a draft written before
   * this existed has no flag, and `false` is the right reading of it.
   */
  keyTouched?: boolean;
};

const keyFor = (workspaceId: string) => `${PREFIX}:${workspaceId}`;

/**
 * A draft worth keeping — anything the user actually filled in.
 *
 * Without this, opening the drawer and closing it again would store an empty
 * form, and the next open would restore "nothing" over the top of the seed a
 * board column passed in. Status and priority are excluded from the comparison
 * for the same reason: they arrive pre-filled, so they are not evidence that
 * anybody typed.
 */
export function isDraftWorthKeeping(value: StoredProjectDraft): boolean {
  const { draft } = value;

  return Boolean(
    draft.name ||
      draft.key ||
      draft.description ||
      draft.icon ||
      draft.color ||
      draft.startDate ||
      draft.endDate ||
      value.people.length > 0 ||
      Object.keys(value.properties).length > 0 ||
      value.shown.length !== OPTIONAL_PROPERTIES.length,
  );
}

/**
 * Reads the stored draft, or `null`.
 *
 * The parse is defensive on purpose: this string was written by an older build
 * of the app as often as by the current one, and a draft whose shape has moved
 * on is thrown away rather than spread into state, where a missing `status`
 * would make an uncontrolled `<select>` out of a controlled one.
 */
export function readProjectDraft(workspaceId: string): StoredProjectDraft | null {
  try {
    const raw = localStorage.getItem(keyFor(workspaceId));
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<StoredProjectDraft>;
    if (!parsed?.draft || typeof parsed.draft !== "object") return null;

    return {
      /* Spread over the empty draft rather than trusted whole: a key the
         stored object is missing has to come from somewhere. */
      draft: { ...EMPTY_DRAFT, ...parsed.draft },
      shown: Array.isArray(parsed.shown) ? parsed.shown : [...OPTIONAL_PROPERTIES],
      properties:
        parsed.properties && typeof parsed.properties === "object"
          ? parsed.properties
          : {},
      people: Array.isArray(parsed.people) ? parsed.people : [],
      keyTouched: parsed.keyTouched === true,
    };
  } catch {
    return null;
  }
}

/** Stores the draft, or clears it when there is nothing in it worth restoring. */
export function writeProjectDraft(workspaceId: string, value: StoredProjectDraft) {
  if (!isDraftWorthKeeping(value)) return clearProjectDraft(workspaceId);

  try {
    localStorage.setItem(keyFor(workspaceId), JSON.stringify(value));
  } catch {
    /* A full quota or a browser blocking site data. The form still works — the
       draft simply will not survive the reload, which is where it started. */
  }
}

export function clearProjectDraft(workspaceId: string) {
  try {
    localStorage.removeItem(keyFor(workspaceId));
  } catch {
    /* Same. Nothing to recover from — the value is already unreachable. */
  }
}
