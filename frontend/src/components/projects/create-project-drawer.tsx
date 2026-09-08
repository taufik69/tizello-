"use client";

import { useSyncExternalStore } from "react";
import { CreateProjectForm } from "@/components/projects/create-project-form";
import type { ProjectScope } from "@/components/projects/project-properties";
import { Drawer } from "@/components/ui/drawer";
import {
  getSurfaceServerSnapshot,
  readStoredSurface,
  subscribeToSurface,
} from "@/lib/project-surface";
import type { ProjectStatus } from "@/types/project";

/**
 * `POST /workspaces/:workspaceId/projects`, as a right-hand drawer.
 *
 * A drawer rather than a centred modal because the list behind it is the
 * context: on the board you are adding to a column you can still see, and a
 * modal that covers it makes you remember where you were. Notion's peek panel
 * makes the same call.
 *
 * THE SHELL STAYS MOUNTED, THE FORM DOES NOT — the same split
 * `EditProjectDrawerShell` uses, and for the same first reason: the native
 * `<dialog>` is what hands focus back to the trigger when it closes, so
 * unmounting it would drop focus on the `<body>`.
 *
 * The second reason is new. The form restores an unsaved draft from
 * `localStorage`, and `key={String(open)}` is what makes that possible without
 * an effect: a fresh mount on every open means the read can live in a
 * `useState` initializer, and `open` is `false` in every server render, so the
 * branch that touches storage never runs where there is no `window`. Reading
 * it in an effect and calling `setState` would trip
 * `react-hooks/set-state-in-effect`; reading it during a shared render would
 * be a hydration mismatch.
 *
 * WHERE it opens is a stored preference, read through `useSyncExternalStore`
 * so a switch made in this panel's own header reaches this component without
 * an effect. It is only a class swap on the same `<dialog>`
 * (`ui/drawer.tsx`), which is what lets someone change their mind halfway
 * through typing without losing what they typed — and why `key` below is
 * `open` alone and not `open` plus the surface.
 */
export function CreateProjectDrawer({
  scope,
  initialStatus,
  open,
  onOpenChange,
}: {
  /** Workspace, schema, roster and the admin flag — see `ProjectScope`. */
  scope: ProjectScope;
  /** Seeds Status when the drawer was opened from a board column or a status group. */
  initialStatus?: ProjectStatus;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const surface = useSyncExternalStore(
    subscribeToSurface,
    readStoredSurface,
    getSurfaceServerSnapshot,
  );

  return (
    <Drawer
      open={open}
      surface={surface}
      onOpenChange={() => onOpenChange(false)}
      aria-label="New project"
    >
      <CreateProjectForm
        key={String(open)}
        scope={scope}
        open={open}
        surface={surface}
        initialStatus={initialStatus}
        onClose={() => onOpenChange(false)}
      />
    </Drawer>
  );
}
