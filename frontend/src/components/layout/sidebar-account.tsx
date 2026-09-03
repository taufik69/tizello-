import { SignOutButton } from "@/components/layout/sign-out-button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { getCurrentUser } from "@/lib/demo-data";
import { initials } from "@/lib/initials";

/**
 * The pinned bottom of the sidebar. Theme and sign-out live here now that the
 * top bar is gone — they are account concerns, not navigation, so they sit
 * below the divider rather than in the nav's scroll region.
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

      <div className="flex items-center justify-between gap-2 px-1">
        <span className="text-2xs text-text-subtle">Theme</span>
        <ThemeToggle />
      </div>

      <SignOutButton />
    </div>
  );
}
