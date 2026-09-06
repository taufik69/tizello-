import { apiCall } from "@/lib/api-client";
import { normaliseEmail } from "@/lib/validation/auth";
import type { AuthResult } from "@/lib/auth";
import type { AuthErrorCode, User } from "@/types/auth";

/*
 * The token half of spec §9 — email verification and password recovery. Split
 * out of `src/lib/auth.ts` only because the two together exceed the 150-line
 * cap; the calls are the same shape.
 *
 * `TOKEN_INVALID` and `TOKEN_EXPIRED` stay distinct all the way to the UI,
 * which is why nothing here collapses them: the verify and reset screens offer
 * "send me a new link" for one and not for the other, and a token that never
 * existed has no new link to offer.
 */

const TOKEN_CODES = ["TOKEN_EXPIRED", "TOKEN_INVALID"] as const;

type TokenCode = (typeof TOKEN_CODES)[number];

const asTokenCode = (code: string): TokenCode =>
  (TOKEN_CODES as readonly string[]).includes(code) ? (code as TokenCode) : "TOKEN_INVALID";

/**
 * `POST /verify-email`. The token comes from the emailed link; an absent one is
 * a malformed visit, not a server error.
 */
export async function verifyEmailToken(
  token: string | undefined,
): Promise<AuthResult> {
  if (!token) return { ok: false, code: "TOKEN_INVALID" };

  const result = await apiCall<{ user: User }>("/api/v1/auth/verify-email", {
    method: "POST",
    body: { token },
  });

  return result.ok
    ? { ok: true, user: result.data.user }
    : { ok: false, code: asTokenCode(result.code) as AuthErrorCode };
}

/**
 * `POST /resend-verification` and `POST /forgot-password` share a shape: both
 * return 202 for an unknown address so neither can be used to test whether an
 * account exists. Nothing is returned to the caller but the fact it finished.
 *
 * Neither inspects the result, deliberately — branching on it here would
 * reintroduce, in the UI, exactly the distinction the 202 exists to hide.
 */
export async function requestVerificationEmail(rawEmail: string): Promise<void> {
  await apiCall("/api/v1/auth/resend-verification", {
    method: "POST",
    body: { email: normaliseEmail(rawEmail) },
  });
}

export async function requestPasswordReset(rawEmail: string): Promise<void> {
  await apiCall("/api/v1/auth/forgot-password", {
    method: "POST",
    body: { email: normaliseEmail(rawEmail) },
  });
}

/**
 * `POST /reset-password`. The backend invalidates every session on success, and
 * the caller does not get one either — possession of a link is not proof of
 * identity (spec §6.4). The user signs in afresh.
 */
export async function resetPassword(input: {
  token: string | undefined;
  password: string;
}): Promise<{ ok: true } | { ok: false; code: TokenCode | "WEAK_PASSWORD" }> {
  if (!input.token) return { ok: false, code: "TOKEN_INVALID" };

  const result = await apiCall("/api/v1/auth/reset-password", {
    method: "POST",
    body: { token: input.token, password: input.password },
  });

  if (result.ok) return { ok: true };

  return {
    ok: false,
    code: result.code === "WEAK_PASSWORD" ? "WEAK_PASSWORD" : asTokenCode(result.code),
  };
}
