"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DrawerBody, DrawerFooter, DrawerHeader } from "@/components/ui/drawer";
import {
  DrawerCloseButton,
  DrawerTitleField,
} from "@/components/projects/drawer-title";
import { ProjectPropertyList } from "@/components/projects/project-property-list";
import {
  shownPropertiesFor,
  type OptionalProperty,
  type ProjectDraft,
} from "@/components/projects/project-properties";
import { draftFrom, changedProperties } from "@/components/projects/edit-project-diff";
import { updateProjectAction } from "@/lib/actions/project-actions";
import { PROJECT_ERROR_COPY, type ProjectRecord } from "@/types/project";
import type {
  ProjectPropertyDef,
  ProjectPropertyPatch,
} from "@/types/project-property";

/**
 * `PATCH /projects/:id`, in the same drawer the create flow uses.
 *
 * Remounted by `key` on every open (see `EditProjectDrawerShell` below), which
 * is what re-seeds the uncontrolled fields from the project as it is NOW rather
 * than as it was when the drawer first mounted.
 *
 * Only changed fields are sent. `PATCH` with the whole row would work, but it
 * would also make every save a write to `updatedAt` for a drawer someone opened
 * and closed, and it would clobber a field a teammate changed in between. An
 * empty patch closes without a request at all.
 *
 * `null` clears a value server-side, so an emptied field has to survive as
 * `null` rather than being dropped as falsy — which is also what makes
 * removing a property row actually remove the value.
 */
export function EditProjectDrawer({
  project,
  workspaceId,
  today,
  definitions,
  canManageProperties,
  meta,
  onClose,
}: {
  project: ProjectRecord;
  workspaceId: string;
  today: string;
  definitions: ProjectPropertyDef[];
  canManageProperties: boolean;
  /**
   * The read-only facts block — owner, collaborators, created, updated.
   *
   * Supplied by the CALLER rather than built here, because building it needs
   * this project's member list, and a drawer opened from a card cannot have
   * that without one request per card. The project detail page has already
   * fetched it, so that is the one place that passes it; everywhere else the
   * drawer edits the project's own fields and the facts live on the page the
   * card links to.
   */
  meta?: React.ReactNode;
  onClose: () => void;
}) {
  const stored = draftFrom(project);
  const [isPending, startTransition] = useTransition();
  const [draft, setDraft] = useState<ProjectDraft>(stored);
  const [shown, setShown] = useState<OptionalProperty[]>(shownPropertiesFor);
  const [errors, setErrors] = useState<Record<string, string>>({});
  /* Seeded from what is stored, so the rows render their current values and
     the diff below can tell a change from a no-op. */
  const [properties, setProperties] = useState<ProjectPropertyPatch>(project.properties);

  function change(patch: Partial<ProjectDraft>) {
    setDraft((current) => ({ ...current, ...patch }));
    setErrors({});
  }

  function patch() {
    const changed = changedProperties(project.properties, properties);
    const name = draft.name.trim();
    const description = draft.description.trim();

    return {
      ...(name !== stored.name ? { name } : {}),
      ...(description !== stored.description ? { description: description || null } : {}),
      ...(draft.status !== stored.status ? { status: draft.status } : {}),
      ...(draft.priority !== stored.priority ? { priority: draft.priority } : {}),
      ...(draft.icon !== stored.icon ? { icon: draft.icon || null } : {}),
      ...(draft.color !== stored.color ? { color: draft.color || null } : {}),
      ...(draft.startDate !== stored.startDate
        ? { startDate: draft.startDate || null }
        : {}),
      ...(draft.endDate !== stored.endDate ? { endDate: draft.endDate || null } : {}),
      ...(changed ? { properties: changed } : {}),
    };
  }

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!draft.name.trim()) {
      setErrors({ name: "Give your project a name." });
      return;
    }

    const changes = patch();
    if (Object.keys(changes).length === 0) {
      onClose();
      return;
    }

    startTransition(async () => {
      const result = await updateProjectAction(workspaceId, project.id, changes);

      if (result.fieldErrors) {
        setErrors(result.fieldErrors);
        return;
      }
      /* The one failure with a field to point at: the API's `422` means the end
         date would land before the stored start date. */
      if (result.code === "VALIDATION_ERROR") {
        setErrors({ endDate: "End date cannot fall before the start date." });
        return;
      }
      if (result.code) {
        toast.error(PROJECT_ERROR_COPY[result.code] ?? PROJECT_ERROR_COPY.SERVER_ERROR);
        return;
      }

      toast.success("Project updated.");
      onClose();
    });
  }

  return (
    <form onSubmit={onSubmit} noValidate>
      <DrawerHeader>
        <p className="min-w-0 flex-1 truncate font-mono text-xs text-text-subtle">
          {project.key}
        </p>
          <DrawerCloseButton onClose={onClose} />
      </DrawerHeader>

      <DrawerBody>
          <DrawerTitleField
            icon={draft.icon}
            color={draft.color}
          defaultValue={project.name}
            placeholder="Untitled"
            error={errors.name}
            onChange={(name) => change({ name })}
          />

        <ProjectPropertyList
          draft={draft}
          errors={errors}
          today={today}
          shown={shown}
          keyEditable={false}
          workspaceId={workspaceId}
          definitions={definitions}
          values={properties}
          canManageProperties={canManageProperties}
          onChange={change}
          onShownChange={setShown}
          onPropertiesChange={(patch) =>
            setProperties((current) => ({ ...current, ...patch }))
          }
          meta={meta}
        />
      </DrawerBody>

      <DrawerFooter>
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving…" : "Save changes"}
        </Button>
      </DrawerFooter>
    </form>
  );
}
