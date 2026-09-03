import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { initials } from "@/lib/initials";
import type { WorkspaceMember } from "@/types/workspace";

/*
 * Avatar, name, email. Initials only — there is no image source in this app,
 * so `Avatar` has no image part and inventing one here would mean a raw `<img>`.
 *
 * The disc carries a hairline of its own: on the owner's row the card fill is
 * already `surface-sunken`, and without the border the disc would disappear
 * into it.
 *
 * No "use client" — only `MemberRow` imports it, and that is already a leaf.
 */
export function MemberIdentity({
  member,
  isCurrentUser,
}: {
  member: WorkspaceMember;
  isCurrentUser: boolean;
}) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <Avatar className="size-9 border border-border bg-surface-sunken">
        <AvatarFallback className="text-xs text-text-muted">
          <span aria-hidden="true">{initials(member.name)}</span>
        </AvatarFallback>
      </Avatar>

      <div className="min-w-0">
        <p className="flex items-center gap-1.5 text-sm font-medium text-text">
          <span className="min-w-0 truncate">{member.name}</span>
          {isCurrentUser && <Badge>You</Badge>}
        </p>
        {/* Long addresses truncate rather than widen the row — `min-w-0` on
            every ancestor up to the flex row is what makes that work. */}
        <p className="truncate text-xs text-text-subtle">{member.email}</p>
      </div>
    </div>
  );
}
