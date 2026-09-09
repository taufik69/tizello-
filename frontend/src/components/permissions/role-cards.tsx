"use client";

import { RoleCard } from "@/components/permissions/role-card";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "@/components/ui/icons";
import type { RoleDefinition } from "@/types/permissions";

/**
 * The role strip: every role in the workspace, and the one control that adds
 * another. One column at 360px, two from `sm`, four from `lg` — a custom role
 * makes four a normal count.
 */
export function RoleCards({
  roles,
  memberCounts,
  actionCount,
  onCreate,
  onEdit,
  onDelete,
}: {
  roles: RoleDefinition[];
  memberCounts: Record<string, number>;
  actionCount: number;
  onCreate: () => void;
  onEdit: (role: RoleDefinition) => void;
  onDelete: (role: RoleDefinition) => void;
}) {
  return (
    <section className="mt-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-text">Roles</h2>
        <Button size="sm" onClick={onCreate}>
          <PlusIcon className="size-3.5" />
          New role
        </Button>
      </div>

      <ul className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {roles.map((role) => (
          <li key={role.id} className="flex">
            <RoleCard
              role={role}
              memberCount={memberCounts[role.id] ?? 0}
              actionCount={actionCount}
              onEdit={() => onEdit(role)}
              onDelete={() => onDelete(role)}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
