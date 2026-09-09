import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/cn";
import { initials } from "@/lib/initials";
import { PROJECT_ROLE_LABEL, type ProjectMemberRecord } from "@/types/project";

/**
 * The project's roster — `GET /projects/:id/members`, owner first.
 *
 * Read-only for now, deliberately. The write endpoints exist and are wired in
 * `lib/project-members.ts`, but adding, changing a role or removing someone
 * all need a person PICKER, and picking a person needs the list of workspace
 * members — an endpoint that does not exist yet (there is no
 * `GET /workspaces/:id/members`). A control that opens an empty picker is
 * worse than one that is not there.
 *
 * `user` is optional on the API's row, so the display name falls back to the
 * id rather than rendering an empty cell — a row with no name is still a row
 * somebody has to be able to count.
 */
const OWN = "bg-brand-100 text-brand-800";
const OTHER = "border border-border bg-surface-sunken text-text-muted";

export function ProjectMembersPanel({
  members,
  currentUserId,
}: {
  members: ProjectMemberRecord[];
  currentUserId: string;
}) {
  return (
    <section className="mt-8">
      <h2 className="text-xs font-semibold tracking-widest text-text-subtle uppercase">
        Members
      </h2>

      {members.length === 0 ? (
        /* Only reachable if the create transaction was broken — the owner's
           OWNER row is written with the project (project.md §7). Worth saying
           plainly rather than rendering an empty list that looks like a
           loading state. */
        <p className="mt-4 rounded-md border border-dashed border-border px-4 py-6 text-center text-sm text-text-muted">
          No members on this project yet.
        </p>
      ) : (
        <ul className="mt-4 divide-y divide-border overflow-hidden rounded-md border border-border bg-surface">
          {members.map((member) => {
            const isCurrentUser = member.userId === currentUserId;
            const name = member.user?.name ?? member.user?.email ?? member.userId;

            return (
              <li key={member.id} className="flex items-center gap-3 px-4 py-3">
                <Avatar className={cn("size-7", isCurrentUser ? OWN : OTHER)}>
                  <AvatarFallback className="text-2xs">
                    <span aria-hidden="true">{initials(name)}</span>
                  </AvatarFallback>
                </Avatar>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-text">
                    {name}
                    {isCurrentUser && (
                      <span className="ml-1.5 text-2xs font-normal text-text-subtle">
                        You
                      </span>
                    )}
                  </p>
                  {member.user?.email && member.user.name && (
                    <p className="truncate text-2xs text-text-subtle">
                      {member.user.email}
                    </p>
                  )}
                </div>

                <Badge variant={member.role === "OWNER" ? "brand" : "default"}>
                  {PROJECT_ROLE_LABEL[member.role]}
                </Badge>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
