import {
  findUserByEmail,
  readToken,
  settle,
  toUser,
  users,
} from "@/lib/auth-fixtures";
import { normaliseEmail } from "@/lib/validation/auth";
import type { AuthResult } from "@/lib/auth";

/*
 * The token half of spec §9 — email verification and password recovery. Split
 * out of `src/lib/auth.ts` only because the two together exceed the 150-line
 * cap; the fixtures and the eventual `fetch` calls are the same shape.
 */

/**
 * `POST /verify-email`. The fixture marks the first unverified account
 * verified, which is enough to drive the success state: there is no token ->
 * user mapping until the backend issues real tokens.
 */
export async function verifyEmailToken(
  token: string | undefined,
): Promise<AuthResult> {
  const state = readToken(token);
  if (state === "expired") return settle({ ok: false, code: "TOKEN_EXPIRED" });
  if (state === "invalid") return settle({ ok: false, code: "TOKEN_INVALID" });

  const pending = users.find((user) => !user.emailVerified) ?? users[0];
  pending.emailVerified = true;
  return settle({ ok: true, user: toUser(pending) });
}

/**
 * `POST /resend-verification` and `POST /forgot-password` share a shape: both
 * return 202 for an unknown address so neither can be used to test whether an
 * account exists. Nothing is returned to the caller but the fact it finished.
 */
export async function requestVerificationEmail(rawEmail: string): Promise<void> {
  const email = normaliseEmail(rawEmail);
  if (findUserByEmail(email)) {
    console.info(`[auth fixture] verification link for ${email}`);
  }
  return settle(undefined);
}

export async function requestPasswordReset(rawEmail: string): Promise<void> {
  const email = normaliseEmail(rawEmail);
  if (findUserByEmail(email)) {
    console.info(`[auth fixture] recovery link for ${email}`);
  }
  return settle(undefined);
}

/**
 * `POST /reset-password`. The real backend invalidates every session on
 * success; here there is nothing to invalidate, and the caller does not get a
 * session either — possession of a link is not proof of identity (spec §6.4).
 */
export async function resetPassword(input: {
  token: string | undefined;
  password: string;
}): Promise<{ ok: true } | { ok: false; code: "TOKEN_EXPIRED" | "TOKEN_INVALID" }> {
  const state = readToken(input.token);
  if (state === "expired") return settle({ ok: false, code: "TOKEN_EXPIRED" });
  if (state === "invalid") return settle({ ok: false, code: "TOKEN_INVALID" });
  return settle({ ok: true });
}

export { readToken };
