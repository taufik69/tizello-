import { AuthLogo } from "@/components/auth/auth-logo";
import { AuthHeader } from "@/components/auth/auth-header";

/**
 * The left half of the split shell: logo pinned top-left, form column centred
 * at 352px, legal footer at the bottom. Full width below `lg`, where the aside
 * is removed.
 *
 * It sits in the page rather than the layout because the layout provides only
 * the grid — the page has to render its own `<AuthAside variant>` as the second
 * grid child, and children cannot be nested inside this column for that.
 */
export function AuthColumn({
  heading,
  sub,
  children,
}: {
  heading: string;
  sub?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col bg-surface px-6 py-8 sm:px-10">
      <AuthLogo />

      <main className="flex flex-1 items-center py-10">
        <div className="mx-auto w-full max-w-[22rem]">
          <AuthHeader heading={heading} sub={sub} />
          {children}
        </div>
      </main>

      <footer className="flex gap-4 text-2xs text-text-subtle">
        <a href="/privacy" className="rounded-xs hover:text-text-muted">
          Privacy
        </a>
        <a href="/terms" className="rounded-xs hover:text-text-muted">
          Terms
        </a>
      </footer>
    </div>
  );
}
