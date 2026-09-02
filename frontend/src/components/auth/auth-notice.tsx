import Link from "next/link";
import { AUTH_BUTTON } from "@/components/auth/auth-submit";

/**
 * A full-screen state that replaces a form: an expired link, a consumed token,
 * a confirmed address. The heading is supplied by `AuthColumn`, so this is the
 * body and its single call to action.
 */
export function AuthNotice({
  body,
  actionHref,
  actionLabel,
  children,
}: {
  body: string;
  actionHref?: string;
  actionLabel?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-text-muted">{body}</p>
      {children}
      {actionHref && actionLabel && (
        <Link
          href={actionHref}
          className={`${AUTH_BUTTON} flex items-center justify-center`}
        >
          {actionLabel}
        </Link>
      )}
    </div>
  );
}
