import { MemberRow } from "@/components/members/member-row";
import { MembersEmpty } from "@/components/members/members-empty";
import { canChangeMemberRole, canRemoveMember } from "@/lib/roles";
import type { WorkspaceMember, WorkspaceRole } from "@/types/workspace";

/**
 * The roster. Keyed on the membership id — the list re-sorts whenever a role
 * changes, so an index key would hand the wrong open menu to the wrong person.
 *
 * The two permissions are resolved ONCE here rather than per row: they depend on
 * the viewer, not on the member being rendered, and computing them inside the
 * map would invite a future reader to think they vary.
 */
export function MembersList({
  members,
  currentUserId,
  viewerRole,
  onRoleChange,
  onRemove,
}: {
  members: WorkspaceMember[];
  currentUserId: string;
  viewerRole: WorkspaceRole;
  onRoleChange: (memberId: string, role: WorkspaceRole) => void;
  onRemove: (member: WorkspaceMember) => void;
}) {
  if (members.length === 0) return <MembersEmpty />;

  const mayChangeRole = canChangeMemberRole(viewerRole);
  const mayRemove = canRemoveMember(viewerRole);

  return (
    <ul className="mt-4 space-y-2">
      {members.map((member) => (
        <li key={member.id}>
          <MemberRow
            member={member}
            isCurrentUser={member.userId === currentUserId}
            canChangeRole={mayChangeRole}
            canRemove={mayRemove}
            onRoleChange={(role) => onRoleChange(member.id, role)}
            onRemove={() => onRemove(member)}
          />
        </li>
      ))}
    </ul>
  );
}
