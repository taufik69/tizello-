import { GitHubMark, GoogleMark } from "@/components/auth/provider-marks";
import { API_BASE } from "@/lib/api-client";

/*
 * Two up in a grid, not a stack (spec §6.6). A third provider wraps to a second
 * short row rather than lengthening a wall of full-width bars.
 *
 * They are <a> elements because starting OAuth is a navigation, not a mutation
 * — and the destination is the API's own origin, not this app's. The browser
 * has to leave for the provider and come back to the callback the provider has
 * registered, so this cannot be a `fetch` and cannot be proxied through Next
 * without breaking the redirect chain.
 *
 * **The path carries no `/oauth` segment.** It is
 * `/api/v1/auth/<provider>/start`, matching the callback registered in the
 * GitHub OAuth App and the Google console — a provider compares the redirect URI
 * character for character, so this string and the console cannot disagree. See
 * backend docs/api/auth.md §12.
 *
 * `next` is passed as a query parameter here and immediately moved *inside* the
 * signed `state` by the API, so it cannot be tampered with in flight.
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
          href={`${API_BASE}/api/v1/auth/${id}/start${query}`}
          className="flex h-10 items-center justify-center gap-2 rounded-sm border border-border bg-surface text-sm font-medium text-text-muted transition-colors duration-100 ease-standard hover:bg-surface-hover hover:text-text"
        >
          <Mark />
          {label}
        </a>
      ))}
    </div>
  );
}
