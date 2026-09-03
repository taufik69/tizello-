import Link from "next/link";
import { RoleBadge } from "@/components/workspace/role-badge";
import { WorkspaceAvatar } from "@/components/workspace/workspace-avatar";
import { WorkspaceSettingsMenu } from "@/components/workspace/workspace-settings-menu";
import { plural } from "@/lib/plural";
import type { Workspace } from "@/types/workspace";

export function WorkspaceDetailHeader({ workspace }: { workspace: Workspace }) {
  return (
    <header>
      <Link
        href="/workspaces"
        className="inline-block rounded-xs text-2xs font-medium text-text-subtle transition-colors duration-100 ease-standard hover:text-text-muted"
      >
        ← All workspaces
      </Link>

      <div className="mt-2 flex items-start gap-3">
        <WorkspaceAvatar
          name={workspace.name}
          accent={workspace.accent}
          className="mt-0.5"
        />

        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-semibold tracking-tight break-words text-text">
            {workspace.name}
          </h1>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <p className="text-sm text-text-muted">
              {plural(workspace.memberCount, "member", "members")}
            </p>
            <RoleBadge role={workspace.role} />
          </div>
        </div>

        <WorkspaceSettingsMenu
          workspaceId={workspace.id}
          workspaceName={workspace.name}
        />
      </div>
    </header>
  );
}
