import { initials } from "@/lib/initials";
import type { Member } from "@/types/board";

/**
 * Overlapping initials discs. Kept small and low-contrast so they read as a
 * property on the card, not a decoration competing with the title.
 */
export function MemberAvatars({ members }: { members: Member[] }) {
  if (members.length === 0) return null;

  return (
    <ul className="flex shrink-0 -space-x-1">
      {members.map((member) => (
        <li
          key={member.id}
          title={member.name}
          className="grid size-5 place-items-center rounded-full border border-surface bg-surface-sunken text-[0.5625rem] font-semibold text-text-subtle"
        >
          <span aria-hidden="true">{initials(member.name)}</span>
          <span className="sr-only">{member.name}</span>
        </li>
      ))}
    </ul>
  );
}
