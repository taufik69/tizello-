"use client";

import { MemberIdentity } from "@/components/members/member-identity";
import { RoleSelect } from "@/components/permissions/role-select";
import { cn } from "@/lib/cn";
import type { RoleDefinition } from "@/types/permissions";
import type { WorkspaceMember } from "@/types/workspace";

/*
 * The roster with one control on it. `MemberRow`'s kebab is deliberately
 * absent — removing someone is the members screen's job, and a destructive
 * menu on a permissions table invites the wrong click.
 *
 * Rows stack below `sm`: at 360px one line would have to choose between a
 * truncated name and a clipped menu.
 */
const ROW =
  "flex flex-col gap-3 rounded-md border border-border p-3 transition-colors duration-100 ease-standard hover:bg-surface-hover sm:flex-row sm:items-center sm:gap-4";

export function MemberRoleList({
  members,
  roles,
  assignments,
  currentUserId,
  onAssign,
}: {
  members: WorkspaceMember[];
  roles: RoleDefinition[];
  /** Member id → role id. Local state; see `useRoles`. */
  assignments: Record<string, string>;
  currentUserId: string;
  onAssign: (member: WorkspaceMember, role: RoleDefinition) => void;
}) {
  return (
    <section className="mt-8">
      <h2 className="text-sm font-semibold text-text">Members</h2>

      {members.length === 0 ? (
        <p className="mt-3 rounded-md border border-dashed border-border bg-surface-sunken px-4 py-8 text-center text-sm text-text-muted">
          Nobody has access to this workspace yet.
        </p>
      ) : (
        <ul className="mt-3 space-y-2">
          {members.map((member) => {
            const roleId = assignments[member.id] ?? member.role;
            const role = roles.find((entry) => entry.id === roleId);
            if (!role) return null;
            const isOwner = role.id === "OWNER";

            return (
              <li key={member.id}>
                <div
                  className={cn(
                    ROW,
                    isOwner ? "bg-surface-sunken" : "bg-surface",
                  )}
                >
                  <MemberIdentity
                    member={member}
                    isCurrentUser={member.userId === currentUserId}
                  />
                  <div className="shrink-0 sm:ml-auto">
                    <RoleSelect
                      memberName={member.name}
                      role={role}
                      roles={roles}
                      locked={isOwner}
                      onSelect={(next) => onAssign(member, next)}
                    />
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
