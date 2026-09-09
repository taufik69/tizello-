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

/*
 * Three reasons a control is locked, and they carry different copy because they
 * are different facts about the world — "the owner can't be removed" and "you
 * can't remove yourself" are not the same sentence, and a reader who is told the
 * wrong one goes looking for a permission they already have.
 *
 * All three mirror a `422` or `403` the API would answer anyway
 * (`backend/docs/api/member.md` §§2-3). Locking here is courtesy; the server is
 * the control.
 */
const OWNER_ROLE_LOCK = "The workspace owner's role can't be changed here.";
const OWNER_REMOVE_LOCK = "The workspace owner can't be removed.";
const SELF_ROLE_LOCK = "You can't change your own role.";
const SELF_REMOVE_LOCK = "Leaving a workspace isn't available yet.";
const ROLE_PERMISSION_LOCK = "Only the workspace owner can change roles.";
const REMOVE_PERMISSION_LOCK = "You don't have permission to remove members.";

export function MemberRow({
  member,
  isCurrentUser,
  canChangeRole,
  canRemove,
  onRoleChange,
  onRemove,
}: {
  member: WorkspaceMember;
  isCurrentUser: boolean;
  /** The VIEWER's permission, identical for every row — see `MembersList`. */
  canChangeRole: boolean;
  canRemove: boolean;
  onRoleChange: (role: WorkspaceRole) => void;
  onRemove: () => void;
}) {
  const isOwner = member.role === "OWNER";

  /* Ordered most-specific first: the owner's own row is both "the owner" and
     "you", and "the owner's role can't be changed" is the more useful of the
     two. A permission failure comes last because it is the one the viewer can
     do nothing about. */
  const roleLock = isOwner
    ? OWNER_ROLE_LOCK
    : isCurrentUser
      ? SELF_ROLE_LOCK
      : canChangeRole
        ? null
        : ROLE_PERMISSION_LOCK;

  const removeLock = isOwner
    ? OWNER_REMOVE_LOCK
    : isCurrentUser
      ? SELF_REMOVE_LOCK
      : canRemove
        ? null
        : REMOVE_PERMISSION_LOCK;

  return (
    <div className={cn(ROW, isOwner ? OWNER_TONE : DEFAULT_TONE)}>
      <MemberIdentity member={member} isCurrentUser={isCurrentUser} />

      <div className="flex shrink-0 items-center gap-1 sm:ml-auto">
        <MemberRoleMenu
          memberName={member.name}
          role={member.role}
          lock={roleLock}
          onRoleChange={onRoleChange}
        />
        <MemberActionsMenu
          memberName={member.name}
          lock={removeLock}
          onRemove={onRemove}
        />
      </div>
    </div>
  );
}
