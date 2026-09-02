import { GitHubMark, GoogleMark } from "@/components/auth/provider-marks";

/*
 * Two up in a grid, not a stack (spec §6.6). A third provider wraps to a second
 * short row rather than lengthening a wall of full-width bars.
 *
 * They are <a> elements, because starting OAuth is a navigation, not a
 * mutation. The endpoint does not exist in v1: they render, they are
 * keyboard-reachable, and they are marked aria-disabled with a "coming soon"
 * note. Stubbing a fake OAuth flow would be worse than saying so.
 */
const PROVIDERS = [
  { id: "google", label: "Google", Mark: GoogleMark },
  { id: "github", label: "GitHub", Mark: GitHubMark },
] as const;

export function SocialButtons({ next }: { next?: string }) {
  const query = next ? `?next=${encodeURIComponent(next)}` : "";

  return (
    <div className="grid grid-cols-2 gap-3">
      {PROVIDERS.map(({ id, label, Mark }) => (
        <a
          key={id}
          href={`/api/auth/oauth/${id}/start${query}`}
          aria-disabled="true"
          title="Coming soon"
          className="flex h-10 items-center justify-center gap-2 rounded-sm border border-border bg-surface text-sm font-medium text-text-muted transition-colors duration-100 ease-standard hover:bg-surface-hover hover:text-text"
        >
          <Mark />
          {label}
          <span className="sr-only">— coming soon</span>
        </a>
      ))}
    </div>
  );
}
