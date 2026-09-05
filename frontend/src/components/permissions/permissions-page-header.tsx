import Link from "next/link";
import { ShieldIcon } from "@/components/ui/app-icons";
import type { Workspace } from "@/types/workspace";

/** The way back and the page's only `<h1>`. One line of context, not three. */
export function PermissionsPageHeader({ workspace }: { workspace: Workspace }) {
  return (
    <header>
      <Link
        href={`/workspaces/${workspace.id}`}
        className="inline-block rounded-xs text-2xs font-medium text-text-subtle transition-colors duration-100 ease-standard hover:text-text-muted"
      >
        ← {workspace.name}
      </Link>

      <h1 className="mt-2 flex items-center gap-2 text-xl font-semibold tracking-tight text-text">
        <ShieldIcon className="size-5 shrink-0 text-text-muted" />
        Roles &amp; permissions
      </h1>
      <p className="mt-1 text-sm text-text-muted">
        Who can do what in this workspace.
      </p>
    </header>
  );
}
