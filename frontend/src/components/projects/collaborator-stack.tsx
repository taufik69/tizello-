import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { plural } from "@/lib/plural";
import type { ProjectPerson } from "@/types/project";

/*
 * Overlapping initials discs. The ring is `border-surface`, not a fixed white,
 * so the discs separate on either theme; `-space-x-1.5` is what overlaps them
 * and the later ones stack above by document order, which is the direction
 * Notion draws them.
 */
const MAX_SHOWN = 3;

export function CollaboratorStack({
  collaborators,
}: {
  collaborators: ProjectPerson[];
}) {
  if (collaborators.length === 0) {
    return <span className="text-xs text-text-subtle">&mdash;</span>;
  }

  const shown = collaborators.slice(0, MAX_SHOWN);
  const overflow = collaborators.length - shown.length;

  return (
    <span className="flex items-center">
      {/* One list, one accessible name: eight separate initials read aloud in
          sequence tell you nothing, so the names are the label and the discs
          are hidden. */}
      <span className="sr-only">
        {plural(collaborators.length, "collaborator", "collaborators")}:{" "}
        {collaborators.map((person) => person.name).join(", ")}
      </span>

      <span aria-hidden="true" className="flex -space-x-1.5">
        {shown.map((person) => (
          <Avatar
            key={person.id}
            className="size-5 border border-surface bg-surface-sunken"
          >
            <AvatarFallback className="text-2xs text-text-muted">
              {person.name.slice(0, 1).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        ))}
        {overflow > 0 && (
          <Avatar className="size-5 border border-surface bg-surface-sunken">
            <AvatarFallback className="text-2xs text-text-muted">
              +{overflow}
            </AvatarFallback>
          </Avatar>
        )}
      </span>
    </span>
  );
}
