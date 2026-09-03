import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/cn";
import { initials } from "@/lib/initials";
import type { ProjectPerson } from "@/types/project";

/*
 * The assignee disc on a row. Initials only, the same bargain `PersonCell`
 * makes: `ProjectPerson` carries no `avatarUrl`, nothing in this app has an
 * image source, and inventing one would mean shipping a placeholder photo of
 * a person who does not exist.
 *
 * Unassigned renders a dashed ring rather than nothing, so the column keeps its
 * rhythm and "nobody has picked this up" is visible at a glance.
 */
const DISC = "size-6 border border-border bg-surface-sunken";

export function TaskAssignee({ assignee }: { assignee?: ProjectPerson }) {
  if (!assignee) {
    return (
      <span
        title="Unassigned"
        className="flex size-6 shrink-0 items-center justify-center rounded-full border border-dashed border-border-strong"
      >
        <span className="sr-only">Unassigned</span>
        <span aria-hidden="true" className="text-2xs text-text-subtle">
          &mdash;
        </span>
      </span>
    );
  }

  return (
    <Avatar className={cn(DISC)} title={assignee.name}>
      <AvatarFallback className="text-2xs text-text-muted">
        <span aria-hidden="true">{initials(assignee.name)}</span>
        <span className="sr-only">Assigned to {assignee.name}</span>
      </AvatarFallback>
    </Avatar>
  );
}
