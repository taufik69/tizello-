import type { Member } from "@/types/board";

function initials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export function MemberAvatars({ members }: { members: Member[] }) {
  if (members.length === 0) return null;

  return (
    <ul className="flex -space-x-1">
      {members.map((member) => (
        <li
          key={member.id}
          title={member.name}
          className="grid size-6 place-items-center rounded-full border border-surface bg-surface-sunken text-2xs font-semibold text-text-muted"
        >
          <span aria-hidden="true">{initials(member.name)}</span>
          <span className="sr-only">{member.name}</span>
        </li>
      ))}
    </ul>
  );
}
