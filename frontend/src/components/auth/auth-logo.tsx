import Link from "next/link";

/**
 * Wordmark for the auth screens. A drawn mark rather than an image: it is nine
 * lines of SVG, inherits the brand token, and costs no request.
 */
export function AuthLogo() {
  return (
    <Link
      href="/"
      className="inline-flex items-center gap-2 rounded-sm text-sm font-semibold text-text"
    >
      <svg viewBox="0 0 16 16" className="size-5 shrink-0" aria-hidden="true">
        <rect width="16" height="16" rx="4" className="fill-brand-500" />
        <path
          d="M4.5 4.5h3v7h-3zM8.5 4.5h3v4.5h-3z"
          className="fill-on-brand"
        />
      </svg>
      Tizello
    </Link>
  );
}
