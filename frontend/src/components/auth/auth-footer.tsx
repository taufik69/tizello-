import Link from "next/link";

/**
 * The block under the form: the one route out of this screen, and — on sign-in
 * — the quieter recovery link beneath it.
 *
 * It sits behind a hairline because without one the links float against the
 * social grid at the same weight as the form's own controls, and the eye reads
 * three peers instead of a form and its footnotes. The primary route keeps the
 * brand colour; anything secondary drops to `text-subtle`, so the two are not
 * competing for the same click.
 */
export function AuthFooter({
  prompt,
  href,
  label,
  secondaryHref,
  secondaryLabel,
}: {
  prompt?: string;
  href: string;
  label: string;
  secondaryHref?: string;
  secondaryLabel?: string;
}) {
  return (
    <div className="mt-7 border-t border-border pt-5 text-center">
      <p className="text-sm text-text-muted">
        {prompt && `${prompt} `}
        <Link
          href={href}
          className="rounded-xs font-semibold text-text-brand underline-offset-4 transition-colors duration-100 ease-standard hover:underline"
        >
          {label}
        </Link>
      </p>

      {secondaryHref && secondaryLabel && (
        <Link
          href={secondaryHref}
          className="mt-2.5 inline-block rounded-xs text-2xs font-medium text-text-subtle underline-offset-4 transition-colors duration-100 ease-standard hover:text-text-muted hover:underline"
        >
          {secondaryLabel}
        </Link>
      )}
    </div>
  );
}
