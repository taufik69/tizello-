import { signOutAction } from "@/lib/actions/auth-actions";

/**
 * Sign out is a POST, never an `<a href>`: a GET that mutates is CSRF-able and
 * gets fired by link prefetchers. A plain form with a Server Action needs no
 * client JavaScript at all.
 */
export function SignOutButton() {
  return (
    <form action={signOutAction}>
      <button
        type="submit"
        className="rounded-sm px-2 py-1 text-xs font-medium text-text-muted transition-colors duration-100 ease-standard hover:bg-surface-hover hover:text-text"
      >
        Sign out
      </button>
    </form>
  );
}
