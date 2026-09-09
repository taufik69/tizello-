"use client";

import { useId, useState } from "react";
import { RolePermissionPicker } from "@/components/permissions/role-permission-picker";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TextField } from "@/components/ui/text-field";
import type { PermissionGroup, RoleDefinition } from "@/types/permissions";

/*
 * Create a role, or re-scope one. The same dialog for both: the fields are
 * identical, and two of these would be two places for the picker to drift.
 *
 * `role` is the one being edited, or `null` to create. The parent MOUNTS this
 * only while it is open, so the draft below starts from `role` and a cancelled
 * edit leaves nothing behind — no effect syncing props into state.
 */
export function RoleDialog({
  open,
  onOpenChange,
  role,
  groups,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role: RoleDefinition | null;
  groups: PermissionGroup[];
  onSubmit: (name: string, allowed: readonly string[]) => void;
}) {
  const titleId = useId();
  const [name, setName] = useState(role?.name ?? "");
  const [allowed, setAllowed] = useState<readonly string[]>(role?.allowed ?? []);
  const [error, setError] = useState<string | undefined>();

  function toggle(actionId: string) {
    setAllowed((current) =>
      current.includes(actionId)
        ? current.filter((id) => id !== actionId)
        : [...current, actionId],
    );
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim()) {
      setError("Give the role a name");
      return;
    }
    onSubmit(name, allowed);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange} aria-labelledby={titleId}>
      {/* noValidate: the browser's bubble would pre-empt the inline error. */}
      <form onSubmit={submit} noValidate>
        <DialogContent>
          <DialogHeader>
            <DialogTitle id={titleId}>
              {role ? `Edit ${role.name}` : "New role"}
            </DialogTitle>
          </DialogHeader>

          <div className="mt-4 space-y-4">
            <TextField
              label="Name"
              name="name"
              placeholder="Reviewer"
              defaultValue={role?.name ?? ""}
              error={error}
              onValueChange={setName}
              autoFocus
            />
            <RolePermissionPicker
              groups={groups}
              allowed={allowed}
              onToggle={toggle}
            />
          </div>

          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit">{role ? "Save role" : "Create role"}</Button>
          </DialogFooter>
        </DialogContent>
      </form>
    </Dialog>
  );
}
