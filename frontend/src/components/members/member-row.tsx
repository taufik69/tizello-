import { MemberActionsMenu } from "@/components/members/member-actions-menu";
import { MemberIdentity } from "@/components/members/member-identity";
import { MemberRoleMenu } from "@/components/members/member-role-menu";
import { cn } from "@/lib/cn";
import type { WorkspaceMember, WorkspaceRole } from "@/types/workspace";

/*
 * Flat and bordered, per DESIGN-SYSTEM.md — a list of rows, not a stack of
 * floating cards. Elevation is reserved for the menus that overlay them.
 *
 * The layout stacks below `sm`: identity on one line, controls on the next.
 * A single row at 360px would have to choose between a truncated name and a
 * clipped menu, and neither is acceptable.
 */
const ROW =
  "flex flex-col gap-3 rounded-md border border-border p-3 transition-colors duration-100 ease-standard hover:bg-surface-hover sm:flex-row sm:items-center sm:gap-4";

/* The owner reads as distinct by fill, not by a new colour: `surface-sunken`
   sits one step away from `surface` in both themes, and the brand-tinted
   "Owner" chip carries the meaning. */
const OWNER_TONE = "bg-surface-sunken";
const DEFAULT_TONE = "bg-surface";

export function MemberRow({
  member,
  isCurrentUser,
  onRoleChange,
  onRemove,
}: {
  member: WorkspaceMember;
  isCurrentUser: boolean;
  onRoleChange: (role: WorkspaceRole) => void;
  onRemove: () => void;
}) {
  const isOwner = member.role === "OWNER";

  return (
    <div className={cn(ROW, isOwner ? OWNER_TONE : DEFAULT_TONE)}>
      <MemberIdentity member={member} isCurrentUser={isCurrentUser} />

      <div className="flex shrink-0 items-center gap-1 sm:ml-auto">
        <MemberRoleMenu
          memberName={member.name}
          role={member.role}
          locked={isOwner}
          onRoleChange={onRoleChange}
        />
        <MemberActionsMenu
          memberName={member.name}
          locked={isOwner}
          onRemove={onRemove}
        />
      </div>
    </div>
  );
}
