import { SignOutButton } from "@/components/layout/sign-out-button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getCurrentUser } from "@/lib/demo-data";
import { initials } from "@/lib/initials";

/**
 * The pinned bottom of the sidebar: who is signed in, and the way out. The
 * theme control lives in the content strip instead, pinned right the way it was
 * in the old top bar.
 */
export async function SidebarAccount() {
  const user = await getCurrentUser();

  return (
    <div className="shrink-0 space-y-2 border-t border-border p-2">
      <div className="flex min-w-0 items-center gap-2 px-1 pt-1">
        <Avatar className="size-6 bg-surface text-text-muted">
          <AvatarFallback className="text-2xs">
            <span aria-hidden="true">{initials(user.name)}</span>
          </AvatarFallback>
        </Avatar>
        <span className="min-w-0 flex-1 truncate text-sm text-text">
          {user.name}
        </span>
      </div>

      <SignOutButton />
    </div>
  );
}
