"use client";

import { useEffect, useState } from "react";
import {
  EMPTY_DRAFT,
  shownPropertiesFor,
  type OptionalProperty,
  type ProjectDraft,
} from "@/components/projects/project-properties";
import {
  clearProjectDraft,
  readProjectDraft,
  writeProjectDraft,
} from "@/components/projects/project-draft-storage";
import { deriveProjectKey } from "@/lib/project-key";
import type { ProjectStatus } from "@/types/project";
import type { ProjectPropertyPatch } from "@/types/project-property";

/**
 * Everything the New project drawer is holding, restored from the last visit
 * and written back as it changes.
 *
 * Lifted out of `create-project-form.tsx` so that file stays under the
 * 150-line cap, and because the persistence is the part with the constraints:
 *
 * - **The read is a `useState` initializer, not an effect.** The form is
 *   remounted on every open (`create-project-drawer.tsx` keys it), and `open`
 *   is `false` in every server render — so the branch that touches
 *   `localStorage` cannot run where there is no `window`, and there is no
 *   hydration mismatch to suppress. An effect that read storage and called
 *   `setState` would also trip `react-hooks/set-state-in-effect`.
 * - **The write IS an effect**, and that is fine: it sets no state. One place
 *   that cannot be forgotten when a fifth piece of state is added, rather than
 *   a `writeProjectDraft` call in every setter.
 *
 * `initialStatus` wins over the restored draft. A trigger at the bottom of the
 * "On hold" column is a statement about the project being created NOW;
 * everything else the draft says is older than that click.
 *
 * THE KEY FOLLOWS THE NAME UNTIL IT IS TOUCHED. `change` derives it on every
 * name keystroke (`lib/project-key.ts`) so the row shows the prefix a task will
 * actually carry instead of the word "Auto", and stops the moment anybody edits
 * the Key field — a value somebody typed is not ours to overwrite on their next
 * keystroke somewhere else.
 *
 * IT DOES NOT RESUME. Clearing an edited Key back to empty leaves it empty
 * rather than re-deriving, because re-deriving would refill the field on the
 * same backspace that emptied it — there would be no way to retype a key from
 * scratch. An empty key is not a lost one either: the create request omits it
 * and the server derives the same value, so "cleared" and "auto" agree.
 */
export function useProjectDraft({
  workspaceId,
  open,
  initialStatus,
}: {
  workspaceId: string;
  open: boolean;
  initialStatus?: ProjectStatus;
}) {
  const [restored, setRestored] = useState(() =>
    open ? readProjectDraft(workspaceId) : null,
  );

  const [draft, setDraft] = useState<ProjectDraft>(() => ({
    ...EMPTY_DRAFT,
    ...restored?.draft,
    ...(initialStatus ? { status: initialStatus } : {}),
  }));
  const [shown, setShown] = useState<OptionalProperty[]>(
    () => restored?.shown ?? shownPropertiesFor(),
  );
  const [properties, setProperties] = useState<ProjectPropertyPatch>(
    () => restored?.properties ?? {},
  );
  /* Staged, not written: there is no project id to post a member to until the
     create comes back. See `collaborators-draft-row.tsx`. */
  const [people, setPeople] = useState<string[]>(() => restored?.people ?? []);
  /* Whether the Key row is the user's to own. Restored with the draft: a key
     typed before a reload must not start following the name again after it. */
  const [keyTouched, setKeyTouched] = useState(() => restored?.keyTouched ?? false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  /* Bumped by `startOver`. Description and the title are uncontrolled inputs
     seeded by `defaultValue`, so clearing their state is not enough — they
     have to be remounted. (Key is controlled now that it follows the name.) */
  const [generation, setGeneration] = useState(0);

  useEffect(() => {
    if (!open) return;
    writeProjectDraft(workspaceId, { draft, shown, properties, people, keyTouched });
  }, [open, workspaceId, draft, shown, properties, people, keyTouched]);

  function change(patch: Partial<ProjectDraft>) {
    setDraft((current) => {
      const next = { ...current, ...patch };

      if (patch.name !== undefined && !keyTouched) next.key = deriveProjectKey(next.name);

      return next;
    });
    if (patch.key !== undefined) setKeyTouched(true);
    setErrors({});
  }

  function startOver() {
    clearProjectDraft(workspaceId);
    setRestored(null);
    setDraft({ ...EMPTY_DRAFT, ...(initialStatus ? { status: initialStatus } : {}) });
    setShown(shownPropertiesFor());
    setProperties({});
    setPeople([]);
    setKeyTouched(false);
    setErrors({});
    setGeneration((current) => current + 1);
  }

  return {
    /** Non-null when this open restored something — the notice is drawn from it. */
    restored,
    draft,
    shown,
    properties,
    people,
    errors,
    /** Decides whether the create request carries a key at all — see the note above. */
    keyTouched,
    generation,
    change,
    startOver,
    setShown,
    setPeople,
    setErrors,
    setProperties,
    /** Thrown away without asking only once: the project it described now exists. */
    clear: () => clearProjectDraft(workspaceId),
  };
}
