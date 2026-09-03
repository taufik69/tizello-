import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function WorkspaceNotFound() {
  return (
    <main className="grid h-full place-items-center px-6">
      <div className="max-w-sm space-y-3 text-center">
        <h1 className="text-xl font-semibold text-text">Workspace not found</h1>
        <p className="text-sm text-text-muted">
          It may have been deleted, or it is no longer shared with you.
        </p>
        <Link href="/workspaces" className={buttonVariants()}>
          Back to workspaces
        </Link>
      </div>
    </main>
  );
}
