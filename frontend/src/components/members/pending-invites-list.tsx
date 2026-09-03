import { PendingInviteRow } from "@/components/members/pending-invite-row";
import { PendingInvitesEmpty } from "@/components/members/pending-invites-empty";
import type { PendingInvitation } from "@/types/workspace";

/**
 * The outstanding invitations. Keyed on the invitation id — the list re-sorts
 * whenever one is added, so an index key would hand the wrong open menu to the
 * wrong address.
 */
export function PendingInvitesList({
  invitations,
  resentIds,
  onResend,
  onCancel,
}: {
  invitations: PendingInvitation[];
  resentIds: string[];
  onResend: (invitation: PendingInvitation) => void;
  onCancel: (invitation: PendingInvitation) => void;
}) {
  if (invitations.length === 0) return <PendingInvitesEmpty />;

  return (
    <ul className="mt-4 space-y-2">
      {invitations.map((invitation) => (
        <li key={invitation.id}>
          <PendingInviteRow
            invitation={invitation}
            resent={resentIds.includes(invitation.id)}
            onResend={() => onResend(invitation)}
            onCancel={() => onCancel(invitation)}
          />
        </li>
      ))}
    </ul>
  );
}
