import { apiCall } from "@/lib/api-client";
import { normaliseEmail } from "@/lib/validation/auth";
import { asAuthError, type AuthResult } from "@/lib/auth";
import type { User } from "@/types/auth";

/*
 * The token half — registration-code verification and password recovery.
 * Split out of `src/lib/auth.ts` only because the two together exceed the
 * 150-line cap; the calls are the same shape.
 *
 * `TOKEN_INVALID` and `TOKEN_EXPIRED` stay distinct all the way to the UI for
 * password reset: the reset screen offers "send me a new link" for one and
 * not for the other, and a token that never existed has no new link to offer.
 * Registration verification uses `CODE_INVALID`/`CODE_EXPIRED` instead — the
 * same codes the login-code flow already uses, since it is the same shape of
 * secret.
 */

const TOKEN_CODES = ["TOKEN_EXPIRED", "TOKEN_INVALID"] as const;

type TokenCode = (typeof TOKEN_CODES)[number];

const asTokenCode = (code: string): TokenCode =>
  (TOKEN_CODES as readonly string[]).includes(code) ? (code as TokenCode) : "TOKEN_INVALID";

/**
 * `POST /verify-registration-code`. Redeeming the code proves the address and
 * signs the user in, same as the login-code flow — the caller just redirects
 * on success rather than showing a separate "verified" screen.
 */
export async function verifyRegistrationCode(input: {
  email: string;
  code: string;
}): Promise<AuthResult> {
  const result = await apiCall<{ user: User }>("/auth/verify-registration-code", {
    method: "POST",
    body: input,
    forwardCookies: true,
  });

  return result.ok
    ? { ok: true, user: result.data.user }
    : { ok: false, code: asAuthError(result.code) };
}

/**
 * `POST /resend-registration-code`. Always resolves, known address or not —
 * the response carries no signal, and the server pads its timing to match.
 */
export async function resendRegistrationCode(rawEmail: string): Promise<void> {
  await apiCall("/auth/resend-registration-code", {
    method: "POST",
    body: { email: normaliseEmail(rawEmail) },
  });
}

/**
 * `POST /forgot-password`. Shares the 202-for-unknown-address shape above —
 * nothing is returned to the caller but the fact it finished.
 */
export async function requestPasswordReset(rawEmail: string): Promise<void> {
  await apiCall("/auth/forgot-password", {
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

  const result = await apiCall("/auth/reset-password", {
    method: "POST",
    body: { token: input.token, password: input.password },
  });

  if (result.ok) return { ok: true };

  return {
    ok: false,
    code: result.code === "WEAK_PASSWORD" ? "WEAK_PASSWORD" : asTokenCode(result.code),
  };
}
