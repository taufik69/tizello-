import Link from "next/link";
import { AUTH_ERROR_COPY, type AuthErrorCode } from "@/types/auth";

/**
 * Form-level failures. The UI never renders a raw server message — a code maps
 * to copy here and nowhere else (spec §8), so a backend string cannot reach the
 * page.
 */
export function AuthAlert({ code }: { code?: AuthErrorCode }) {
  if (!code) return null;

  return (
    <div
      role="alert"
      className="rounded-sm border border-danger bg-danger-subtle px-3 py-2 text-2xs text-danger"
    >
      {AUTH_ERROR_COPY[code]}
      {code === "EMAIL_NOT_VERIFIED" && (
        <>
          {" "}
          <Link href="/verify-email?pending=1" className="font-semibold underline">
            Resend link
          </Link>
        </>
      )}
    </div>
  );
}
