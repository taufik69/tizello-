"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerBody, DrawerFooter, DrawerHeader } from "@/components/ui/drawer";
import {
  DrawerCloseButton,
  DrawerTitleField,
} from "@/components/projects/drawer-title";
import { ProjectPropertyList } from "@/components/projects/project-property-list";
import {
  EMPTY_DRAFT,
  type OptionalProperty,
  type ProjectDraft,
} from "@/components/projects/project-properties";
import { createProjectAction } from "@/lib/actions/project-actions";
import { PROJECT_ERROR_COPY, type ProjectStatus } from "@/types/project";
import type {
  ProjectPropertyDef,
  ProjectPropertyPatch,
} from "@/types/project-property";

/**
 * `POST /workspaces/:workspaceId/projects`, as a right-hand drawer.
 *
 * A drawer rather than a centred modal because the list behind it is the
 * context: on the board you are adding to a column you can still see, and a
 * modal that covers it makes you remember where you were. Notion's peek panel
 * makes the same call.
 *
 * The title is an untitled-page-style input rather than a labelled field — it
 * is the one thing that must be filled in, and giving it the same 12px label
 * as Key and Status buries it among them.
 *
 * `createProjectAction` is called directly from the submit handler inside
 * `startTransition`, not through `useActionState`: the result is branched on
 * synchronously right there, so closing on success never needs an effect
 * watching for it.
 */
export function CreateProjectDrawer({
  workspaceId,
  workspaceName,
  today,
  definitions,
  canManageProperties,
  initialStatus,
  open,
  onOpenChange,
}: {
  workspaceId: string;
  workspaceName: string;
  /** The workspace's custom-property schema, fetched on the server. */
  definitions: ProjectPropertyDef[];
  /** Workspace OWNER/ADMIN — decides whether the schema controls are drawn. */
  canManageProperties: boolean;
  /** `YYYY-MM-DD`, for the calendar. Resolved on the server — never a clock read in a component. */
  today: string;
  /** Seeds Status when the drawer was opened from a board column or a status group. */
  initialStatus?: ProjectStatus;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [isPending, startTransition] = useTransition();
  const seed = { ...EMPTY_DRAFT, ...(initialStatus ? { status: initialStatus } : {}) };
  const [draft, setDraft] = useState<ProjectDraft>(seed);
  const [shown, setShown] = useState<OptionalProperty[]>([]);
  const [properties, setProperties] = useState<ProjectPropertyPatch>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  function close() {
    setDraft(seed);
    setShown([]);
    setProperties({});
    setErrors({});
    onOpenChange(false);
  }

  function change(patch: Partial<ProjectDraft>) {
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
        /* Sent only when the user typed one — a supplied key that collides is
           a `409`, where a derived one is silently suffixed. */
        key: draft.key.trim() || undefined,
        description: draft.description.trim() || undefined,
        status: draft.status,
        priority: draft.priority,
        icon: draft.icon || undefined,
        color: draft.color || undefined,
        startDate: draft.startDate || undefined,
        endDate: draft.endDate || undefined,
        /* Omitted entirely when nothing was filled in — the API validates the
           map against the workspace's definitions, and an empty object is a
           request that means nothing. */
        ...(Object.keys(properties).length > 0 ? { properties } : {}),
      });

      if (result.fieldErrors) {
        setErrors(result.fieldErrors);
        return;
      }
      if (result.code === "CONFLICT") {
        setErrors({ key: "That key is already used in this workspace." });
        return;
      }
      if (result.code === "VALIDATION_ERROR") {
        setErrors({ endDate: "End date cannot fall before the start date." });
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
    <Drawer open={open} onOpenChange={close} aria-label="New project">
      <form onSubmit={onSubmit} noValidate>
        <DrawerHeader>
          <p className="min-w-0 flex-1 truncate text-xs text-text-subtle">
            New project in {workspaceName}
          </p>
          <DrawerCloseButton onClose={close} />
        </DrawerHeader>

        <DrawerBody>
          <DrawerTitleField
            icon={draft.icon}
            color={draft.color}
            placeholder="New project"
            error={errors.name}
          autoFocus
            onChange={(name) => change({ name })}
          />

          <ProjectPropertyList
            draft={draft}
            errors={errors}
            today={today}
            shown={shown}
            keyEditable
            workspaceId={workspaceId}
            definitions={definitions}
            values={properties}
            canManageProperties={canManageProperties}
            onChange={change}
            onShownChange={setShown}
            onPropertiesChange={(patch) =>
              setProperties((current) => ({ ...current, ...patch }))
            }
          />
        </DrawerBody>

        <DrawerFooter>
          <Button type="button" variant="outline" onClick={close}>
            Cancel
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? "Creating…" : "Create project"}
          </Button>
        </DrawerFooter>
      </form>
    </Drawer>
  );
}
