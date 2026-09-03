import { MemberRow } from "@/components/members/member-row";
import { MembersEmpty } from "@/components/members/members-empty";
import type { WorkspaceMember, WorkspaceRole } from "@/types/workspace";

/**
 * The roster. Keyed on the membership id — the list re-sorts whenever a role
 * changes, so an index key would hand the wrong open menu to the wrong person.
 */
export function MembersList({
  members,
  currentUserId,
  onRoleChange,
  onRemove,
}: {
  members: WorkspaceMember[];
  currentUserId: string;
  onRoleChange: (memberId: string, role: WorkspaceRole) => void;
  onRemove: (member: WorkspaceMember) => void;
}) {
  if (members.length === 0) return <MembersEmpty />;

  return (
    <ul className="mt-4 space-y-2">
      {members.map((member) => (
        <li key={member.id}>
          <MemberRow
            member={member}
            isCurrentUser={member.userId === currentUserId}
            onRoleChange={(role) => onRoleChange(member.id, role)}
            onRemove={() => onRemove(member)}
          />
        </li>
      ))}
    </ul>
  );
}
