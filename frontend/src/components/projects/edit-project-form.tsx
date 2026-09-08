"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  EditProjectFields,
  type EditProjectDraft,
} from "@/components/projects/edit-project-fields";
import { updateProjectAction } from "@/lib/actions/project-actions";
import { PROJECT_ERROR_COPY, type ProjectRecord } from "@/types/project";

/**
 * The body of `EditProjectDialog`, split out so the shell can remount it by
 * `key` on every open — that is what re-seeds the uncontrolled fields from the
 * project as it is NOW, rather than as it was when the dialog first mounted.
 *
 * Only changed fields are sent. `PATCH` with the whole row would work, but it
 * would also make every save a write to `updatedAt` for a dialog someone
 * opened and closed, and it would clobber a field a teammate changed in
 * between. An empty patch closes without a request at all.
 */
export function EditProjectForm({
  project,
  workspaceId,
  onClose,
}: {
  project: ProjectRecord;
  workspaceId: string;
  onClose: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [draft, setDraft] = useState<EditProjectDraft>({
    name: project.name,
    description: project.description ?? "",
    status: project.status,
    priority: project.priority,
    icon: project.icon ?? "",
    color: project.color ?? "",
    startDate: project.startDate?.slice(0, 10) ?? "",
    endDate: project.endDate?.slice(0, 10) ?? "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  /* `null` clears a value server-side, so an emptied field has to survive as
     `null` rather than being dropped as falsy — an emptied description means
     "remove it", and sending `""` would be a 400. */
  function patch() {
    const name = draft.name.trim();
    const description = draft.description.trim();
    const storedStart = project.startDate?.slice(0, 10) ?? "";
    const storedEnd = project.endDate?.slice(0, 10) ?? "";

    return {
      ...(name !== project.name ? { name } : {}),
      ...(description !== (project.description ?? "")
        ? { description: description || null }
        : {}),
      ...(draft.status !== project.status ? { status: draft.status } : {}),
      ...(draft.priority !== project.priority ? { priority: draft.priority } : {}),
      ...(draft.icon !== (project.icon ?? "") ? { icon: draft.icon || null } : {}),
      ...(draft.color !== (project.color ?? "") ? { color: draft.color || null } : {}),
      ...(draft.startDate !== storedStart ? { startDate: draft.startDate || null } : {}),
      ...(draft.endDate !== storedEnd ? { endDate: draft.endDate || null } : {}),
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
      /* The one failure with a field to point at: the API's `422` means the
         end date would land before the stored start date, which is a date
         problem, not a "something went wrong" toast. */
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit project</DialogTitle>
          <DialogDescription>
            Its key never changes — {project.key} stays the same however the
            name is edited, because every task id already carries it.
          </DialogDescription>
        </DialogHeader>

        <EditProjectFields
          project={project}
          draft={draft}
          errors={errors}
          onChange={(next) => {
            setDraft((current) => ({ ...current, ...next }));
            setErrors({});
          }}
        />

        <DialogFooter className="mt-6">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? "Saving…" : "Save changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </form>
  );
}
