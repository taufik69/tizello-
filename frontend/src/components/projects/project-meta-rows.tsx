import { CollaboratorsRow } from "@/components/projects/collaborators-row";
import { PropertyRow } from "@/components/projects/property-row";
import { formatDate } from "@/lib/format-date";
import type { ProjectMemberRecord, ProjectRecord } from "@/types/project";
import type { WorkspaceMemberRow } from "@/lib/workspaces";

/**
 * The facts a project has rather than fields it carries — who owns it, when it
 * was made, when it last changed.
 *
 * READ-ONLY, and not offered by "+ Add a property". They are `ownerId`,
 * `createdAt` and `updatedAt`, which the API already returns on every project;
 * defining them as custom properties would be two sources for one fact, and
 * Notion's own Created time behaves exactly this way — always there, never
 * editable.
 *
 * Create has no such facts yet: a project that does not exist has no created
 * time and no owner but the person typing. So this renders on the EDIT drawer
 * only.
 *
 * The owner is resolved to a NAME through the workspace roster, which
 * `GET /workspaces/:id/members` now provides — the gap `ProjectOwnerCell` used
 * to document. "You" still wins for the signed-in user: it needs no lookup and
 * is the case people scan for.
 *
 * Collaborators sit here rather than among the editable fields because they
 * are the same kind of thing — a fact about the project's people — even though
 * that one row does write.
 */
export function ProjectMetaRows({
  project,
  currentUserId,
  members,
  workspaceMembers,
  canWrite,
}: {
  project: ProjectRecord;
  currentUserId?: string;
  members: ProjectMemberRecord[];
  workspaceMembers: WorkspaceMemberRow[];
  canWrite: boolean;
}) {
  /* The roster is what turns `ownerId` into a name. Before
     `GET /workspaces/:id/members` existed this row could only say "You" or
     "Another member"; now it can say who. */
  const owner = workspaceMembers.find((member) => member.userId === project.ownerId);
  const ownerName =
    project.ownerId === currentUserId
      ? "You"
      : (owner?.user?.name ?? owner?.user?.email ?? "Another member");

  return (
    <>
      <PropertyRow label="Owner" icon="people">
        <p className="px-2.5 py-2 text-sm text-text-muted">{ownerName}</p>
      </PropertyRow>

      <CollaboratorsRow
        projectId={project.id}
        workspaceId={project.workspaceId}
        ownerId={project.ownerId}
        members={members}
        workspaceMembers={workspaceMembers}
        canWrite={canWrite}
      />

      <PropertyRow label="Created" icon="calendar">
        <p className="px-2.5 py-2 text-sm text-text-muted">
          {formatDate(project.createdAt)}
        </p>
      </PropertyRow>

      <PropertyRow label="Last updated" icon="calendar">
        <p className="px-2.5 py-2 text-sm text-text-muted">
          {formatDate(project.updatedAt)}
        </p>
      </PropertyRow>
    </>
  );
}
