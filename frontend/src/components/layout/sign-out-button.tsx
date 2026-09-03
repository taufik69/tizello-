import { SignOutIcon } from "@/components/ui/nav-icons";
import { signOutAction } from "@/lib/actions/auth-actions";

/**
 * Sign out is a POST, never an `<a href>`: a GET that mutates is CSRF-able and
 * gets fired by link prefetchers. A plain form with a Server Action needs no
 * client JavaScript at all.
 *
 * Styled as a sidebar row — it lives in the account block at the bottom of the
 * sidebar, so it matches the nav items rather than a top-bar control.
 */
export function SignOutButton() {
  return (
    <form action={signOutAction}>
      <button
        type="submit"
        className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm text-text-muted transition-colors duration-100 ease-standard hover:bg-surface-sunken hover:text-text"
      >
        <SignOutIcon className="size-4 shrink-0" />
        Sign out
      </button>
    </form>
  );
}
