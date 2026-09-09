import { PersonCell } from "@/components/projects/person-cell";
import type { ProjectPerson } from "@/types/project";

/**
 * The Owner column.
 *
 * `ownerId` is the only thing a LIST response carries — the API returns ids,
 * and a name for one is available solely from `GET /projects/:id/members`,
 * which is per project (`lib/projects.ts` §*The owner gap*). So this renders
 * three ways, in descending order of what is actually known:
 *
 *   1. a resolved `owner`, when a members call has populated it;
 *   2. "You", when the id is the signed-in user's — which needs no lookup and
 *      is the case a person most wants to spot in a table;
 *   3. an em dash, for someone else's id with no name attached.
 *
 * Case 3 is a real gap rather than a styling choice, and it closes the moment
 * a workspace-members endpoint exists to resolve the whole page's ids in one
 * request. Drawing a truncated cuid instead would be worse than drawing
 * nothing: it looks like data and answers no question.
 */
export function ProjectOwnerCell({
  ownerId,
  owner,
  currentUserId,
}: {
  ownerId: string;
  owner?: ProjectPerson;
  currentUserId: string;
}) {
  const isCurrentUser = ownerId === currentUserId;

  if (owner) {
    return <PersonCell person={owner} isCurrentUser={isCurrentUser} />;
  }

  if (isCurrentUser) {
    return <PersonCell person={{ id: ownerId, name: "You" }} isCurrentUser />;
  }

  return <span className="text-xs text-text-subtle">&mdash;</span>;
}
