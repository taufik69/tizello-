"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DrawerBody, DrawerFooter, DrawerHeader } from "@/components/ui/drawer";
import {
  DrawerCloseButton,
  DrawerTitleField,
} from "@/components/projects/drawer-title";
import { CollaboratorsDraftRow } from "@/components/projects/collaborators-draft-row";
import { DraftRestoredNotice } from "@/components/projects/draft-restored-notice";
import { ProjectPropertyList } from "@/components/projects/project-property-list";
import type { ProjectScope } from "@/components/projects/project-properties";
import { useProjectDraft } from "@/components/projects/use-project-draft";
import { submitNewProject } from "@/components/projects/create-project-submit";
import { SurfaceMenu } from "@/components/projects/surface-menu";
import type { ProjectSurface } from "@/lib/project-surface";
import type { ProjectStatus } from "@/types/project";

/**
 * The body of the New project drawer.
 *
 * Remounted by `key` on every open — see `create-project-drawer.tsx` for why
 * that is what lets `useProjectDraft` restore from `localStorage` without an
 * effect and without a hydration mismatch.
 *
 * `submitNewProject` is called directly from the submit handler inside
 * `startTransition`, not through `useActionState`: the result is branched on
 * synchronously right there, so closing on success never needs an effect
 * watching for it. What that call actually does — one create, then N member
 * posts — lives in `create-project-submit.ts`.
 */
export function CreateProjectForm({
  scope,
  open,
  surface,
  initialStatus,
  onClose,
}: {
  scope: ProjectScope;
  /** Gates the storage read — see the note above. */
  open: boolean;
  /** Drawn by `SurfaceMenu` in the header, which is also what changes it. */
  surface: ProjectSurface;
  /** Seeds Status when the drawer was opened from a board column or a status group. */
  initialStatus?: ProjectStatus;
  onClose: () => void;
}) {
  const { workspaceId } = scope;
  const [isPending, startTransition] = useTransition();
  const form = useProjectDraft({ workspaceId, open, initialStatus });

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const name = form.draft.name.trim();
    if (!name) {
      form.setErrors({ name: "Give your project a name." });
      return;
    }

    startTransition(async () => {
      const outcome = await submitNewProject({
        workspaceId,
        draft: { ...form.draft, name },
        keyTouched: form.keyTouched,
        properties: form.properties,
        people: form.people,
      });

      if (!outcome.ok) {
        if (outcome.fieldErrors) form.setErrors(outcome.fieldErrors);
        if (outcome.message) toast.error(outcome.message);
        return;
      }

      form.clear();

      if (outcome.warning) toast.error(outcome.warning);
      else toast.success(`${name} is ready.`);
      onClose();
    });
  }

  return (
    <form onSubmit={onSubmit} noValidate>
      <DrawerHeader>
        <p className="min-w-0 flex-1 truncate text-xs text-text-subtle">
          New project in {scope.workspaceName}
        </p>
        <SurfaceMenu surface={surface} />
        <DrawerCloseButton onClose={onClose} />
      </DrawerHeader>

      <DrawerBody>
        {form.restored && <DraftRestoredNotice onStartOver={form.startOver} />}

        <DrawerTitleField
          key={`title-${form.generation}`}
          icon={form.draft.icon}
          color={form.draft.color}
          defaultValue={form.draft.name}
          placeholder="New project"
          error={form.errors.name}
          autoFocus
          onChange={(name) => form.change({ name })}
        />

        <ProjectPropertyList
          key={`properties-${form.generation}`}
          draft={form.draft}
          errors={form.errors}
          today={scope.today}
          shown={form.shown}
          keyEditable
          workspaceId={workspaceId}
          definitions={scope.definitions}
          values={form.properties}
          canManageProperties={scope.canManageProperties}
          onChange={form.change}
          onShownChange={form.setShown}
          onPropertiesChange={(patch) =>
            form.setProperties((current) => ({ ...current, ...patch }))
          }
          people={
            <CollaboratorsDraftRow
              workspaceMembers={scope.workspaceMembers}
              currentUserId={scope.currentUserId}
              selected={form.people}
              onChange={form.setPeople}
            />
          }
        />
      </DrawerBody>

      <DrawerFooter>
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Creating…" : "Create project"}
        </Button>
      </DrawerFooter>
    </form>
  );
}
