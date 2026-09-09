"use client";

import { Checkbox } from "@/components/ui/checkbox";
import type { PermissionGroup } from "@/types/permissions";

/**
 * The permission list inside the role dialog: one checkbox per action, under
 * its area. A `<fieldset>` per group, so a screen reader announces "Workspace"
 * before the three boxes rather than reading fourteen unrelated labels.
 */
export function RolePermissionPicker({
  groups,
  allowed,
  onToggle,
}: {
  groups: PermissionGroup[];
  allowed: readonly string[];
  onToggle: (actionId: string) => void;
}) {
  return (
    <div className="space-y-4">
      {groups.map((group) => (
        <fieldset key={group.area}>
          <legend className="text-2xs font-semibold tracking-widest text-text-subtle uppercase">
            {group.label}
          </legend>

          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {group.actions.map((action) => (
              <Checkbox
                key={action.id}
                name={action.id}
                label={action.label}
                checked={allowed.includes(action.id)}
                onChange={() => onToggle(action.id)}
              />
            ))}
          </div>
        </fieldset>
      ))}
    </div>
  );
}
