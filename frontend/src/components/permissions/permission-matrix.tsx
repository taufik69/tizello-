"use client";

import { PermissionMatrixGroup } from "@/components/permissions/permission-matrix-group";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { PermissionGroup, RoleDefinition } from "@/types/permissions";

/*
 * Columns come from the role list, not from a fixed union, so a role created
 * above appears here as a column whose cells can be toggled.
 *
 * The three built-in columns stay read-only: the app is written against them,
 * and a workspace that could revoke the Owner's delete would be describing a
 * product that does not exist. A workspace's own roles are entirely its own.
 *
 * `Table` brings its own `overflow-x-auto`, which is what keeps five columns
 * from taking the page sideways at 360px.
 */
export function PermissionMatrix({
  groups,
  roles,
  onToggle,
}: {
  groups: PermissionGroup[];
  roles: RoleDefinition[];
  onToggle: (roleId: string, actionId: string) => void;
}) {
  return (
    <section className="mt-8">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-sm font-semibold text-text">Permissions</h2>
        <p className="text-2xs text-text-subtle">
          Built-in roles are fixed. Tap a cell on your own roles.
        </p>
      </div>

      <div className="mt-3 overflow-hidden rounded-md border border-border bg-surface">
        <Table>
          <TableHeader>
            <TableRow className="bg-surface">
              <TableHead className="px-4 py-2">Action</TableHead>
              {roles.map((role) => (
                <TableHead
                  key={role.id}
                  className="px-4 py-2 text-center whitespace-nowrap"
                >
                  {role.name}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>

          <TableBody>
            {groups.map((group) => (
              <PermissionMatrixGroup
                key={group.area}
                group={group}
                roles={roles}
                onToggle={onToggle}
              />
            ))}
          </TableBody>
        </Table>
      </div>
    </section>
  );
}
