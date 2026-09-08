"use client";

import { useId, useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  CreateProjectFields,
  type CreateProjectDraft,
} from "@/components/projects/create-project-fields";
import { createProjectAction } from "@/lib/actions/project-actions";
import { PROJECT_ERROR_COPY } from "@/types/project";

/**
 * `POST /workspaces/:workspaceId/projects`.
 *
 * `createProjectAction` is called directly from the submit handler inside
 * `startTransition`, not through `useActionState` — the result is branched on
 * right there, synchronously, so closing the dialog on success never needs an
 * effect watching for it. Same arrangement as `CreateWorkspaceDialog`.
 *
 * `CONFLICT` gets its own sentence rather than the generic copy: on this
 * endpoint it means one specific thing — the key the user typed is taken — and
 * it is the one error they can actually fix from here.
 */
const EMPTY: CreateProjectDraft = {
  name: "",
  key: "",
  description: "",
  status: "PLANNING",
  priority: "MEDIUM",
  icon: "",
  color: "",
};

export function CreateProjectDialog({
  workspaceId,
  workspaceName,
  open,
  onOpenChange,
}: {
  workspaceId: string;
  workspaceName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const titleId = useId();
  const [isPending, startTransition] = useTransition();
  const [draft, setDraft] = useState<CreateProjectDraft>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function close() {
    setDraft(EMPTY);
    setErrors({});
    onOpenChange(false);
  }

  function change(patch: Partial<CreateProjectDraft>) {
    setDraft((current) => ({ ...current, ...patch }));
    setErrors({});
  }

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const name = draft.name.trim();
    if (!name) {
      setErrors({ name: "Give your project a name." });
      return;
    }

    startTransition(async () => {
      const result = await createProjectAction(workspaceId, {
        name,
        /* Sent only when the user typed one — see `lib/projects.ts`
           §createProject for why an unwanted key turns a transparent retry
           into an unfixable error. */
        key: draft.key.trim() || undefined,
        description: draft.description.trim() || undefined,
        status: draft.status,
        priority: draft.priority,
        icon: draft.icon || undefined,
        color: draft.color || undefined,
      });

      if (result.fieldErrors) {
        setErrors(result.fieldErrors);
        return;
      }
      if (result.code === "CONFLICT") {
        setErrors({ key: "That key is already used in this workspace." });
        return;
      }
      if (result.code) {
        toast.error(PROJECT_ERROR_COPY[result.code] ?? PROJECT_ERROR_COPY.SERVER_ERROR);
        return;
      }

      toast.success(`${name} is ready.`);
      close();
    });
  }

  return (
    <Dialog open={open} onOpenChange={close} aria-labelledby={titleId}>
      <form onSubmit={onSubmit} noValidate>
        <DialogContent>
          <DialogHeader>
            <DialogTitle id={titleId}>New project</DialogTitle>
            <DialogDescription>
              This project will live in {workspaceName}. You can rename it later
              — its key cannot change.
            </DialogDescription>
          </DialogHeader>

          <CreateProjectFields draft={draft} errors={errors} onChange={change} />

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={close}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Creating…" : "Create project"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </form>
    </Dialog>
  );
}
