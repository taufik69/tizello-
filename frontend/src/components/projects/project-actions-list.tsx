"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreIcon, PencilIcon, TrashIcon } from "@/components/ui/icons";
import {
  ArchiveIcon,
  OpenIcon,
  RestoreIcon,
} from "@/components/projects/project-action-icons";
import { ProjectGlyph } from "@/components/projects/project-glyph";
import { StatusDot } from "@/components/projects/status-dot";
import { buttonVariants } from "@/components/ui/button";
import { PROJECT_STATUS_LABEL, type ProjectRecord } from "@/types/project";

/**
 * The ⋯ menu itself — trigger, header and entries. The state and the three
 * confirmations it opens stay in `project-actions-menu.tsx`.
 *
 * The header is the project, not a caption. It used to be a
 * `DropdownMenuLabel`: the name alone, uppercased, letter-spaced and
 * `text-subtle`, which is the styling of a SECTION heading — so the one line
 * that said which project you were about to delete looked like the word
 * "Actions". It is a glyph, the name at full contrast, and the key and status
 * underneath, because a menu opened from the seventh row of a table has to
 * answer "which one is this" before it offers to delete it.
 *
 * Every entry carries an icon. Not decoration: Archive and Delete are one
 * separator apart and both end a project's presence in the list, and a box
 * versus a bin is the difference read at a glance where two similar sentences
 * are not.
 */
export function ProjectActionsList({
  project,
  mayWrite,
  mayOwn,
  showOpenLink,
  onEdit,
  onArchive,
  onDelete,
}: {
  project: ProjectRecord;
  mayWrite: boolean;
  mayOwn: boolean;
  showOpenLink: boolean;
  onEdit: () => void;
  onArchive: () => void;
  onDelete: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`Actions for ${project.name}`}
        className={buttonVariants({ variant: "ghost", size: "icon" })}
      >
        <MoreIcon className="size-4" />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end">
        <div className="flex items-start gap-2 px-2 pt-1.5 pb-2">
          <ProjectGlyph
            icon={project.icon}
            color={project.color}
            size="default"
            className="mt-0.5"
          />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-text">{project.name}</p>
            <p className="mt-0.5 flex items-center gap-1.5 text-2xs text-text-subtle">
              <span className="font-mono">{project.key}</span>
              <span aria-hidden="true">·</span>
              <StatusDot status={project.status} />
              {PROJECT_STATUS_LABEL[project.status]}
            </p>
          </div>
        </div>

        <DropdownMenuSeparator />

        {showOpenLink && (
          <DropdownMenuItem
            icon={<OpenIcon />}
            href={`/workspaces/${project.workspaceId}/projects/${project.id}`}
          >
            Open project
          </DropdownMenuItem>
        )}

        {mayWrite && (
          <>
            <DropdownMenuItem icon={<PencilIcon />} onSelect={onEdit}>
              Edit project
            </DropdownMenuItem>
            <DropdownMenuItem
              icon={project.isArchived ? <RestoreIcon /> : <ArchiveIcon />}
              onSelect={onArchive}
            >
              {project.isArchived ? "Restore project" : "Archive project"}
            </DropdownMenuItem>
          </>
        )}

        {mayOwn && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="danger"
              icon={<TrashIcon />}
              onSelect={onDelete}
            >
              Delete project
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
