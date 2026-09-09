"use client";

import Link from "next/link";
import { useEffect } from "react";
import { AUTH_ERROR_COPY, type AuthFormState } from "@/types/auth";
import { toast } from "sonner";

/*
 * Form-level failures. The UI never renders a raw server message — a code maps
 * to copy here and nowhere else (spec §8), so a backend string cannot reach the
 * page.
 *
 * Every code the API returns — WEAK_PASSWORD, EMAIL_TAKEN, RATE_LIMITED,
 * INVALID_CREDENTIALS, SERVER_ERROR, all of them — also fires a toast, because
 * this one component is what every auth form's `AuthFormState.code` renders
 * through. Fixing it here fixes sign-up, sign-in, forgot-password and
 * reset-password at once.
 *
 * **The inline banner keeps `role="alert"`; the toast does not re-announce.**
 * Two live regions carrying the same sentence would read it to a screen reader
 * twice, back to back — the toast is the single accessible announcement, this
 * box is the persistent visual one (and the only place `EMAIL_NOT_VERIFIED`'s
 * resend link lives, which a toast has no room for and which must survive
 * longer than a toast's few seconds on screen).
 *
 * `email` is optional and only feeds that resend link. Without it `/verify-email`
 * opens on its "tell us where to send a code" step and asks for an address the
 * user just typed one field above — so the sign-in form passes what it has.
 */
export function AuthAlert({
  state,
  email,
}: {
  state: AuthFormState;
  email?: string;
}) {
  // Keyed on `state`, not on `state.code` alone. `useActionState` returns a
  // fresh object on every dispatch, but a code is a primitive string —
  // submitting the same wrong password twice returns the identical string
  // both times, and an effect keyed on that value alone would fire once and
  // then go silent on the second, third, nth identical failure. Keying on the
  // whole object means every submission that produced a code produces exactly
  // one toast, repeats included. `state.code` is read here (not destructured
  // above) so the lint rule sees the actual dependency this effect reads.
  useEffect(() => {
    if (state.code) toast.error(AUTH_ERROR_COPY[state.code]);
  }, [state]);

  const { code } = state;
  if (!code) return null;

  return (
    <div className="rounded-sm border border-danger bg-danger-subtle px-3 py-2 text-2xs text-danger">
      {AUTH_ERROR_COPY[code]}
      {code === "EMAIL_NOT_VERIFIED" && (
        <>
          {" "}
          <Link
            href={
              email
                ? `/verify-email?email=${encodeURIComponent(email)}`
                : "/verify-email"
            }
            className="font-semibold underline"
          >
            Resend code
          </Link>
        </>
      )}
    </div>
  );
}
