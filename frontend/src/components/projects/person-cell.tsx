import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/cn";
import { initials } from "@/lib/initials";
import type { ProjectPerson } from "@/types/project";

/*
 * Avatar plus name, for the Owner and Created by columns. Initials only —
 * nothing in this app has an image source, and inventing one would mean a raw
 * `<img>`.
 *
 * The signed-in user's disc takes the brand tint (`brand-100 / brand-800`,
 * 6.22:1 and identical in both themes, per the contrast table in
 * DESIGN-SYSTEM.md) so your own rows are findable without a second column.
 */
const OWN = "bg-brand-100 text-brand-800";
const OTHER = "border border-border bg-surface-sunken text-text-muted";

export function PersonCell({
  person,
  isCurrentUser = false,
}: {
  person: ProjectPerson;
  isCurrentUser?: boolean;
}) {
  return (
    <span className="flex min-w-0 items-center gap-1.5">
      <Avatar className={cn("size-5", isCurrentUser ? OWN : OTHER)}>
        <AvatarFallback className="text-2xs">
          <span aria-hidden="true">{initials(person.name)}</span>
        </AvatarFallback>
      </Avatar>
      <span className="min-w-0 truncate text-xs text-text-muted">
        {person.name}
      </span>
    </span>
  );
}
